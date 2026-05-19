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
  } = useChatRoom()

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

  /** When you're signed into Google, delete Drive files you uploaded that are already locked (partner may have no Google session). */
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
      <PageHeader
        title="Memories"
        description={
          peerUsername
            ? `Photos and videos with ${peerUsername}. Either of you can upload from your own device; both can open and play without signing in to Google.`
            : 'Photos and videos with your partner. Either of you can upload from your own device; both can open and play without signing in to Google.'
        }
      />

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
            <p className="text-sm font-semibold text-nje-border">No peer profile found</p>
            <p className="mt-1 text-xs leading-relaxed text-nje-muted">
              Set up profiles in Supabase (see repo README) before sharing memories.
            </p>
          </NjeCard>
        </div>
      ) : null}

      {peerReady ? (
        <NjeCard tone="surface" padding="md" className="shrink-0 shadow-[var(--shadow-nje-flat-sm)]">
          <p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-nje-whisper">Google Drive</p>
          <p className="mt-1 text-xs leading-relaxed text-nje-muted">
            <span className="font-semibold text-nje-border/90">Upload:</span> each of you connects Google once per
            device (the shared Drive folder must allow both accounts to add files).{' '}
            <span className="font-semibold text-nje-border/90">Watch:</span> no Google sign-in needed—each file is{' '}
            <span className="font-semibold text-nje-border/90">anyone with the link can view</span>, so either of you
            can tap and play. After view-once / view-twice finishes, the file is removed from Drive when possible to save
            quota (run migration 007 for DB cleanup).
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
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
          </div>
          {gd.error ? (
            <p className="mt-2 text-xs font-medium text-nje-border" role="alert">
              {gd.error}
            </p>
          ) : null}
          {!googleConfigured ? (
            <p className="mt-2 text-xs text-nje-muted">
              Add VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_DRIVE_ROOT_FOLDER_ID to .env.local (see .env.example). Never put
              your client secret in the frontend.
            </p>
          ) : null}
        </NjeCard>
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
        />
      ) : null}
    </div>
  )
}
