import { useCallback, useMemo, useState } from 'react'
import { GoogleConnectButton } from '../components/drive/GoogleConnectButton'
import { FullscreenMediaViewer } from '../components/chat/FullscreenMediaViewer'
import { MessageActionSheet } from '../components/chat/MessageActionSheet'
import { MessageInput } from '../components/chat/MessageInput'
import { MessageList } from '../components/chat/MessageList'
import { NjeCard } from '../components/ui/NjeCard'
import { PageHeader } from '../components/ui/PageHeader'
import { readDriveRootFolderId, readGoogleClientId } from '../config/googleDrive'
import { useChatRoom } from '../context/chat-room-context'
import { usePinnedMoments } from '../hooks/usePinnedMoments'
import { isLegacyMemoriesMedia } from '../services/mediaLifecycle.service'
import { useGoogleDrive } from '../providers/GoogleDriveProvider'
import type { MessageRow } from '../types/message'
import type { FullscreenMediaPayload } from '../types/mediaViewer'
import { isMediaViewLocked } from '../utils/mediaLock'
import type { MediaSendViewMode } from '../utils/mediaViewMode'
import type { ReplyInsertMeta } from '../utils/messageReply'

export function MemoriesPage() {
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

  const mediaMessages = useMemo(() => messages.filter(isLegacyMemoriesMedia), [messages])

  const handleOpenMedia = useCallback(
    (payload: FullscreenMediaPayload) => {
      const row = messages.find((m) => m.id === payload.messageId)
      if (row && isMediaViewLocked(row)) return
      setMediaViewer(payload)
    },
    [messages],
  )

  const handleSendMedia = useCallback(
    async (
      file: File,
      caption: string,
      opts: { surface: 'chat' | 'memories'; viewMode: MediaSendViewMode; reply?: ReplyInsertMeta | null },
      onUploadProgress?: (pct: number) => void,
    ) => {
      const res = await sendMedia(file, caption, { ...opts, surface: 'memories' }, onUploadProgress)
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
        description="Photos, clips, and voice on the shelf — Google Drive when connected."
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
        surface="memories"
        replyTo={replyTo}
        onClearReply={() => setReplyTo(null)}
        onSendMedia={handleSendMedia}
        disabled={!peerReady || Boolean(error)}
        sending={sending}
      />

      <FullscreenMediaViewer
        open={Boolean(mediaViewer)}
        payload={mediaViewer}
        onClose={() => setMediaViewer(null)}
        onMediaViewRecorded={patchMessage}
        onRecordMediaViewFailure={() => void reload()}
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
