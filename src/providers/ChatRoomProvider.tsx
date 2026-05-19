import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { loginEmailToUsername } from '../config/njeAuth'
import { ChatRoomContext, type ChatRoomContextValue } from '../context/chat-room-context'
import { useAuth } from '../hooks/useAuth'
import { useMediaUpload } from '../hooks/useMediaUpload'
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
import type { MessageRow } from '../types/message'
import type { ReplyInsertMeta } from '../utils/messageReply'
import { viewLimitFromSendMode, type MediaSendViewMode } from '../utils/mediaViewMode'
import { chatRoomTopicId, mediaThreadFolder } from '../utils/chatTopic'

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

export function ChatRoomProvider({ children }: ChatRoomProviderProps) {
  const { user } = useAuth()
  const currentId = user?.id ?? null
  const myUsername = loginEmailToUsername(user?.email ?? '') ?? null

  const [peerId, setPeerId] = useState<string | null>(null)
  const [peerUsername, setPeerUsername] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [peerOnline, setPeerOnline] = useState(false)
  const [peerTyping, setPeerTyping] = useState(false)
  const [roomConnected, setRoomConnected] = useState(false)

  const threadFolder = currentId && peerId ? mediaThreadFolder(currentId, peerId) : null
  const { uploadFile } = useMediaUpload(threadFolder)

  const channelRef = useRef<RealtimeChannel | null>(null)
  const typingOffTimerRef = useRef<number>(0)

  const load = useCallback(async () => {
    if (!currentId) {
      setLoading(false)
      setPeerId(null)
      setPeerUsername(null)
      setMessages([])
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
    void load()
  }, [load])

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
    }

    channel
      .on('presence', { event: 'sync' }, syncPresence)
      .on('presence', { event: 'join' }, syncPresence)
      .on('presence', { event: 'leave' }, syncPresence)
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
          })
          syncPresence()
        }
      })

    return () => {
      window.clearTimeout(typingOffTimerRef.current)
      channelRef.current = null
      setRoomConnected(false)
      setPeerTyping(false)
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
      notifyTyping(false)
      setSending(true)
      const up = await uploadFile(file, onUploadProgress)
      if (up.error) {
        setSending(false)
        return { error: up.error }
      }
      if (!up.path) {
        setSending(false)
        return { error: 'Upload failed.' }
      }
      const res = await sendMediaMessage(currentId, peerId, {
        mediaPath: up.path,
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
    [currentId, peerId, notifyTyping, uploadFile],
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
      peerId,
      peerOnline,
      peerTyping,
      peerUsername,
      roomConnected,
      sendMessage,
      sendMedia,
      notifyTyping,
      patchMessage,
      sending,
      load,
    ],
  )

  return <ChatRoomContext.Provider value={value}>{children}</ChatRoomContext.Provider>
}
