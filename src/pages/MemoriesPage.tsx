import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GoogleConnectButton } from '../components/drive/GoogleConnectButton'
import { NjeCard } from '../components/ui/NjeCard'
import { PageHeader } from '../components/ui/PageHeader'
import { readDriveRootFolderId, readGoogleClientId } from '../config/googleDrive'
import { FullscreenMediaViewer } from '../components/chat/FullscreenMediaViewer'
import { MessageActionSheet } from '../components/chat/MessageActionSheet'
import { MessageInput } from '../components/chat/MessageInput'
import { MessageList } from '../components/chat/MessageList'
import { useChatRoom } from '../context/chat-room-context'
import { usePinnedMoments } from '../hooks/usePinnedMoments'
import { purgeDriveMemoryAfterLock } from '../services/media.service'
import { useGoogleDrive } from '../providers/GoogleDriveProvider'
import type { MessageRow } from '../types/message'
import type { FullscreenMediaPayload } from '../types/mediaViewer'
import type { MediaSendViewMode } from '../utils/mediaViewMode'
import { isGdriveMediaRef, parseGdriveFileId } from '../utils/gdriveMediaUrl'
import { isMediaViewLocked } from '../utils/mediaLock'
import type { ReplyInsertMeta } from '../utils/messageReply'

export function MemoriesPage() {
  const sweepAttemptedRef = useRef<Set<string>>(new Set())
  const [replyTo, setReplyTo] = useState<MessageRow | null>(null)
  const [sheetMessage, setSheetMessage] = useState<MessageRow | null>(null)
  const [mediaViewer, setMediaViewer] = useState<FullscreenMediaPayload | null>(null)

  const {
    messages,
    loading,
    error,
    sending,
    peerUsername,
    currentId,
    sendMedia,
    deleteMessage,
    patchMessage,
    reload,
    peerId,
    myPresenceStatus,
  } = useChatRoom()

  const pinned = usePinnedMoments(currentId, peerId, myPresenceStatus)
  const gd = useGoogleDrive()
  const googleConfigured = Boolean(readGoogleClientId() && readDriveRootFolderId())
  const peerReady = Boolean(peerId)

  const mediaMessages = useMemo(
    () =>
      messages.filter(
        (m) => (m.message_type === 'image' || m.message_type === 'video') && m.media_url && !m.deleted_at,
      ),
    [messages],
  )

  /** When you're signed into Google, delete Drive files you uploaded that are already locked (viewer may have no Google session). */
  useEffect(() => {
    if (!peerReady || !currentId || !gd.accessToken) return
    const mine = messages.filter(
      (m) =>
        m.sender_id === currentId &&
        m.is_locked &&
        m.media_url &&
        isGdriveMediaRef(m.media_url) &&
        m.view_limit != null &&
        m.view_limit > 0,
    )
    for (const m of mine) {
      const fid = parseGdriveFileId(m.media_url!)
      if (!fid || sweepAttemptedRef.current.has(m.id)) continue
      sweepAttemptedRef.current.add(m.id)
      void purgeDriveMemoryAfterLock(fid, m.id).then((r) => {
        if (!r.cleared) sweepAttemptedRef.current.delete(m.id)
        if (r.cleared) patchMessage(m.id, { media_url: null, media_type: null })
      })
    }
  }, [peerReady, currentId, gd.accessToken, messages, patchMessage])

  const closeMediaViewer = useCallback(() => {
    setMediaViewer(null)
  }, [])

  const handleOpenMedia = useCallback(
    (payload: FullscreenMediaPayload) => {
      const row = messages.find((m) => m.id === payload.messageId)
      if (row && isMediaViewLocked(row)) return
      setMediaViewer(payload)
    },
    [messages],
  )

  const reloadConversation = useCallback(() => {
    void reload()
  }, [reload])

  const handleSendMedia = useCallback(
    async (
      file: File,
      caption: string,
      opts: { viewMode: MediaSendViewMode; reply?: ReplyInsertMeta | null },
      onUploadProgress?: (pct: number) => void,
    ) => {
      const res = await sendMedia(file, caption, opts, onUploadProgress)
      if (!res.error) setReplyTo(null)
      return res
    },
    [sendMedia],
  )

  const handleDeleteFromSheet = useCallback(async () => {
    if (!sheetMessage) return
    const res = await deleteMessage(sheetMessage.id)
    if (res.error) {
      window.alert(res.error)
      return
    }
    setSheetMessage(null)
  }, [sheetMessage, deleteMessage])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader title="Memories" />

      {error ? (
        <div className="shrink-0 pb-2 pt-1">
          <NjeCard tone="surface" padding="md" className="shadow-[0_2px_0_0_rgba(90,46,30,0.05)]">
            <p className="text-sm font-semibold text-nje-border">Could not load memories</p>
            <p className="mt-1 text-xs text-nje-muted">{error}</p>
          </NjeCard>
        </div>
      ) : null}

      {!loading && !error && !peerReady ? (
        <div className="shrink-0 pb-2 pt-1">
          <NjeCard tone="yellow" padding="md" className="shadow-[0_2px_0_0_rgba(90,46,30,0.05)]">
            <p className="text-sm font-semibold text-nje-border">No other profile found</p>
            <p className="mt-1 text-xs leading-relaxed text-nje-muted">
              Set up profiles in Supabase for each account so the app can resolve the other user (see repo README).
            </p>
          </NjeCard>
        </div>
      ) : null}

      {peerReady ? (
        <div className="shrink-0 flex flex-wrap items-center gap-2 border-b-[2px] border-nje-border pb-2 pt-1 shadow-[0_2px_0_0_rgba(90,46,30,0.04)]">
          <GoogleConnectButton
            connected={gd.connected}
            busy={gd.busy || !gd.platformReady}
            disabled={!googleConfigured}
            onConnect={gd.connect}
            onDisconnect={gd.disconnect}
          />
          {googleConfigured && gd.connected && gd.foldersReady ? (
            <span className="text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-nje-muted">Ready</span>
          ) : null}
          {gd.error ? (
            <p className="w-full text-xs font-medium text-nje-border" role="alert">
              {gd.error}
            </p>
          ) : null}
        </div>
      ) : null}

      <MessageList
        messages={mediaMessages}
        currentUserId={currentId}
        peerUsername={peerUsername}
        loading={loading}
        peerReady={peerReady}
        onOpenMedia={handleOpenMedia}
        onOpenMessageActions={(m) => {
          if (m.deleted_at) return
          setSheetMessage(m)
        }}
        emptyVariant="memories"
        className="min-h-0"
      />

      <MessageInput
        variant="memories"
        replyTo={replyTo}
        onClearReply={() => setReplyTo(null)}
        onSendMedia={handleSendMedia}
        disabled={!peerReady || Boolean(error)}
        sending={sending}
      />

      <FullscreenMediaViewer
        open={Boolean(mediaViewer)}
        payload={mediaViewer}
        onClose={closeMediaViewer}
        onMediaViewRecorded={patchMessage}
        onRecordMediaViewFailure={reloadConversation}
      />

      {sheetMessage ? (
        <MessageActionSheet
          open
          isOwn={sheetMessage.sender_id === currentId}
          onClose={() => setSheetMessage(null)}
          onReply={() => {
            setReplyTo(sheetMessage)
            setSheetMessage(null)
          }}
          onDelete={handleDeleteFromSheet}
          showPin={peerReady}
          isPinned={pinned.pinnedMessageIds.has(sheetMessage.id)}
          onPin={async () => {
            const r = await pinned.pinMessage(sheetMessage)
            if (r.error) window.alert(r.error)
            else setSheetMessage(null)
          }}
        />
      ) : null}
    </div>
  )
}
