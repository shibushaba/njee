import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { readDriveRootFolderId, readGoogleClientId } from '../config/googleDrive'
import { loginEmailToUsername } from '../config/njeAuth'
import { ChatRoomContext, type ChatRoomContextValue } from '../context/chat-room-context'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import {
  fetchConversation,
  fetchPeerProfile,
  markMessagesSeen,
  normalizeMessageRow,
  sendMediaMessage,
  sendTextMessage,
  softDeleteMessage,
} from '../services/message.service'
import { classifyMediaFile } from '../services/media.service'
import { driveAddAnyoneReaderPermission, driveUploadMultipart } from '../services/googleDrive/driveApi'
import type { MessageRow } from '../types/message'
import type { PresenceStatusId } from '../types/presenceStatus'
import { isPresenceStatusId } from '../types/presenceStatus'
import { fetchProfilePresence, updateMyPresence } from '../services/presenceStatus.service'
import { GDRIVE_MEDIA_PREFIX } from '../utils/gdriveMediaUrl'
import type { ReplyInsertMeta } from '../utils/messageReply'
import { viewLimitFromSendMode, type MediaSendViewMode } from '../utils/mediaViewMode'
import { chatRoomTopicId } from '../utils/chatTopic'
import { GoogleDriveProvider, useGoogleDrive } from './GoogleDriveProvider'

type ChatRoomProviderProps = {
  children: ReactNode
}

function readPeerOnline(channel: RealtimeChannel, peerId: string | null) {
  if (!peerId) return false
  const state = channel.presenceState() as Record<string, { user_id?: string }[]>
  const direct = state[peerId]
  if (direct && direct.length > 0) return true
  const flat = Object.values(state).flat() as { user_id?: string }[]
  return flat.some((p) => p?.user_id === peerId)
}

function readPeerPresenceFromChannel(channel: RealtimeChannel, peerId: string | null): PresenceStatusId | null {
  if (!peerId) return null
  const state = channel.presenceState() as Record<string, { user_id?: string; presence_status?: string }[]>
  const flat = Object.values(state).flat() as { user_id?: string; presence_status?: string }[]
  const hit = flat.find((p) => p?.user_id === peerId && p.presence_status)
  if (hit?.presence_status && isPresenceStatusId(hit.presence_status)) return hit.presence_status
  return null
}

export function ChatRoomProvider({ children }: ChatRoomProviderProps) {
  return (
    <GoogleDriveProvider>
      <ChatRoomProviderInner>{children}</ChatRoomProviderInner>
    </GoogleDriveProvider>
  )
}

function ChatRoomProviderInner({ children }: ChatRoomProviderProps) {
  const { user } = useAuth()
  const currentId = user?.id ?? null
  const myUsername = loginEmailToUsername(user?.email ?? '') ?? null
  const gd = useGoogleDrive()

  const [peerId, setPeerId] = useState<string | null>(null)
  const [peerUsername, setPeerUsername] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [peerOnline, setPeerOnline] = useState(false)
  const [peerTyping, setPeerTyping] = useState(false)
  const [roomConnected, setRoomConnected] = useState(false)
  const [myPresenceStatus, setMyPresenceStatus] = useState<PresenceStatusId>('active_now')
  const [peerPresenceDb, setPeerPresenceDb] = useState<PresenceStatusId>('active_now')
  const [peerPresenceLive, setPeerPresenceLive] = useState<PresenceStatusId | null>(null)

  const channelRef = useRef<RealtimeChannel | null>(null)
  const typingOffTimerRef = useRef<number>(0)
  const myPresenceStatusRef = useRef<PresenceStatusId>('active_now')

  const load = useCallback(async () => {
    if (!currentId) {
      setLoading(false)
      setPeerId(null)
      setPeerUsername(null)
      setMessages([])
      setPeerPresenceLive(null)
      setPeerPresenceDb('active_now')
      return
    }

    setLoading(true)
    setError(null)

    const peerRes = await fetchPeerProfile(currentId)
    if (peerRes.error) {
      setError(peerRes.error.message)
      setLoading(false)
      return
    }

    if (!peerRes.data) {
      setPeerId(null)
      setPeerUsername(null)
      setMessages([])
      setPeerPresenceLive(null)
      setPeerPresenceDb('active_now')
      setLoading(false)
      return
    }

    setPeerId(peerRes.data.id)
    setPeerUsername(peerRes.data.username)

    const conv = await fetchConversation(currentId, peerRes.data.id)
    if (conv.error) {
      setError(conv.error.message)
      setLoading(false)
      return
    }

    setMessages(conv.data ?? [])
    setLoading(false)

    await markMessagesSeen(currentId, peerRes.data.id)
  }, [currentId])

  useEffect(() => {
    myPresenceStatusRef.current = myPresenceStatus
  }, [myPresenceStatus])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!currentId || !peerId) return

    let cancelled = false

    void (async () => {
      const [mine, theirs] = await Promise.all([fetchProfilePresence(currentId), fetchProfilePresence(peerId)])
      if (cancelled) return
      if (mine.data) {
        setMyPresenceStatus(mine.data.presence_status)
        myPresenceStatusRef.current = mine.data.presence_status
      }
      if (theirs.data) {
        setPeerPresenceDb(theirs.data.presence_status)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [currentId, peerId])

  useEffect(() => {
    if (!currentId || !peerId) return

    const topic = chatRoomTopicId(currentId, peerId)
    const channel = supabase.channel(`nje-room:${topic}`, {
      config: {
        presence: { key: currentId },
        broadcast: { self: true },
      },
    })

    channelRef.current = channel
    setRoomConnected(false)

    const syncPresence = () => {
      setPeerOnline(readPeerOnline(channel, peerId))
      setPeerPresenceLive(readPeerPresenceFromChannel(channel, peerId))
    }

    const onProfilePresence = (payload: { new: Record<string, unknown> }) => {
      const row = payload.new
      const id = String(row.id ?? '')
      const raw = row.presence_status
      const next: PresenceStatusId =
        typeof raw === 'string' && isPresenceStatusId(raw) ? raw : 'active_now'
      if (id === peerId) {
        setPeerPresenceDb(next)
      }
      if (id === currentId) {
        setMyPresenceStatus(next)
        myPresenceStatusRef.current = next
        void channel.track({
          user_id: currentId,
          username: myUsername ?? 'member',
          presence_status: next,
        })
      }
    }

    channel
      .on('presence', { event: 'sync' }, syncPresence)
      .on('presence', { event: 'join' }, syncPresence)
      .on('presence', { event: 'leave' }, syncPresence)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${peerId}` }, (p) =>
        onProfilePresence({ new: p.new as Record<string, unknown> }),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${currentId}` },
        (p) => onProfilePresence({ new: p.new as Record<string, unknown> }),
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const p = payload as { userId?: string; active?: boolean }
        if (p.userId === peerId) {
          setPeerTyping(Boolean(p.active))
        }
      })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const row = normalizeMessageRow(payload.new)
          const inThread =
            (row.sender_id === currentId && row.receiver_id === peerId) ||
            (row.sender_id === peerId && row.receiver_id === currentId)
          if (!inThread) return

          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev
            return [...prev, row].sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
            )
          })

          if (row.sender_id === peerId) {
            setPeerTyping(false)
          }

          if (row.receiver_id === currentId) {
            void markMessagesSeen(currentId, peerId)
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          const row = normalizeMessageRow(payload.new)
          const inThread =
            (row.sender_id === currentId && row.receiver_id === peerId) ||
            (row.sender_id === peerId && row.receiver_id === currentId)
          if (!inThread) return
          setMessages((prev) => prev.map((m) => (m.id === row.id ? row : m)))
        },
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setRoomConnected(true)
          await channel.track({
            user_id: currentId,
            username: myUsername ?? 'member',
            presence_status: myPresenceStatusRef.current,
          })
          syncPresence()
        }
      })

    return () => {
      window.clearTimeout(typingOffTimerRef.current)
      channelRef.current = null
      setRoomConnected(false)
      setPeerTyping(false)
      setPeerPresenceLive(null)
      void supabase.removeChannel(channel)
    }
  }, [currentId, peerId, myUsername])

  const notifyTyping = useCallback(
    (active: boolean) => {
      const ch = channelRef.current
      if (!ch || !currentId) return

      if (active) {
        window.clearTimeout(typingOffTimerRef.current)
        void ch.send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId: currentId, active: true },
        })
        typingOffTimerRef.current = window.setTimeout(() => {
          void ch.send({
            type: 'broadcast',
            event: 'typing',
            payload: { userId: currentId, active: false },
          })
        }, 1600)
      } else {
        window.clearTimeout(typingOffTimerRef.current)
        void ch.send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId: currentId, active: false },
        })
      }
    },
    [currentId],
  )

  const sendMessage = useCallback(
    async (text: string, opts?: { reply?: ReplyInsertMeta | null }): Promise<{
      error: string | null
    }> => {
      if (!currentId || !peerId) {
        return { error: 'Chat is not ready yet.' }
      }
      notifyTyping(false)
      setSending(true)
      const res = await sendTextMessage(currentId, peerId, text, { reply: opts?.reply ?? undefined })
      setSending(false)
      if (res.error) {
        return { error: res.error.message }
      }
      if (res.data) {
        const row = normalizeMessageRow(res.data)
        setMessages((prev) => {
          if (prev.some((m) => m.id === row.id)) return prev
          return [...prev, row].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
          )
        })
      }
      return { error: null }
    },
    [currentId, peerId, notifyTyping],
  )

  const sendMedia = useCallback(
    async (
      file: File,
      caption: string,
      opts: { viewMode: MediaSendViewMode; reply?: ReplyInsertMeta | null },
      onUploadProgress?: (pct: number) => void,
    ): Promise<{ error: string | null }> => {
      if (!currentId || !peerId) {
        return { error: 'Chat is not ready yet.' }
      }
      const kind = classifyMediaFile(file)
      if (!kind) {
        return { error: 'Only images or videos can be sent.' }
      }

      if (!readGoogleClientId() || !readDriveRootFolderId()) {
        return {
          error:
            'Google Drive is not configured. Add VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_DRIVE_ROOT_FOLDER_ID to .env.local.',
        }
      }
      if (!gd.accessToken) {
        return { error: 'Connect Google on the Memories screen before uploading.' }
      }
      if (!gd.foldersReady) {
        return { error: 'Google Drive folders are still preparing. Try again in a moment.' }
      }

      const category = kind === 'image' ? 'photos' : 'videos'
      const parent = gd.folderId(category)
      if (!parent) {
        return { error: 'Drive folder for this media type is not ready.' }
      }

      notifyTyping(false)
      setSending(true)

      const up = await driveUploadMultipart(gd.accessToken, file, parent, (loaded, total) => {
        if (total > 0) onUploadProgress?.(Math.min(99, Math.round((loaded / total) * 100)))
      })
      onUploadProgress?.(100)

      if (up.error || !up.file?.id) {
        setSending(false)
        return { error: up.error ?? 'Upload to Google Drive failed.' }
      }

      const share = await driveAddAnyoneReaderPermission(gd.accessToken, up.file.id)
      if (share.error) {
        setSending(false)
        return {
          error: `Uploaded, but sharing failed (link access required for playback): ${share.error}`,
        }
      }

      const mediaPath = `${GDRIVE_MEDIA_PREFIX}${up.file.id}`
      const res = await sendMediaMessage(currentId, peerId, {
        mediaPath,
        mediaType: kind,
        caption,
        viewLimit: viewLimitFromSendMode(opts.viewMode),
        isLocked: false,
        reply: opts.reply ?? undefined,
      })
      setSending(false)
      if (res.error) {
        return { error: res.error.message }
      }
      if (res.data) {
        const row = normalizeMessageRow(res.data)
        setMessages((prev) => {
          if (prev.some((m) => m.id === row.id)) return prev
          return [...prev, row].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
          )
        })
      }
      return { error: null }
    },
    [currentId, peerId, notifyTyping, gd.accessToken, gd.foldersReady, gd.folderId],
  )

  const patchMessage = useCallback((messageId: string, patch: Partial<MessageRow>) => {
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, ...patch } : m)))
  }, [])

  const deleteMessage = useCallback(
    async (messageId: string): Promise<{ error: string | null }> => {
      if (!currentId) {
        return { error: 'Chat is not ready yet.' }
      }
      const res = await softDeleteMessage(currentId, messageId)
      if (res.error) {
        return { error: res.error.message }
      }
      if (res.data) {
        const row = normalizeMessageRow(res.data)
        setMessages((prev) => prev.map((m) => (m.id === messageId ? row : m)))
      }
      return { error: null }
    },
    [currentId],
  )

  const setPresenceStatus = useCallback(
    async (status: PresenceStatusId): Promise<{ error: string | null }> => {
      if (!currentId) {
        return { error: 'Chat is not ready yet.' }
      }
      const res = await updateMyPresence(currentId, status)
      if (res.error) {
        return { error: res.error }
      }
      myPresenceStatusRef.current = status
      setMyPresenceStatus(status)
      const ch = channelRef.current
      if (ch) {
        await ch.track({
          user_id: currentId,
          username: myUsername ?? 'member',
          presence_status: status,
        })
      }
      return { error: null }
    },
    [currentId, myUsername],
  )

  const peerPresenceStatus: PresenceStatusId = peerId ? (peerPresenceLive ?? peerPresenceDb) : 'active_now'

  const value = useMemo<ChatRoomContextValue>(
    () => ({
      messages,
      loading,
      error,
      sending,
      peerId,
      peerUsername,
      myUsername,
      currentId,
      peerOnline,
      peerTyping,
      roomConnected,
      peerPresenceStatus,
      myPresenceStatus,
      setPresenceStatus,
      sendMessage,
      sendMedia,
      deleteMessage,
      notifyTyping,
      reload: load,
      patchMessage,
    }),
    [
      currentId,
      deleteMessage,
      error,
      loading,
      messages,
      myUsername,
      myPresenceStatus,
      peerId,
      peerOnline,
      peerPresenceStatus,
      peerTyping,
      peerUsername,
      roomConnected,
      sendMessage,
      sendMedia,
      setPresenceStatus,
      notifyTyping,
      patchMessage,
      sending,
      load,
    ],
  )

  return <ChatRoomContext.Provider value={value}>{children}</ChatRoomContext.Provider>
}
