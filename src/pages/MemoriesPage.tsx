import { useCallback, useMemo, useState } from 'react'
import { NjeCard } from '../components/ui/NjeCard'
import { PageHeader } from '../components/ui/PageHeader'
import { FullscreenMediaViewer } from '../components/chat/FullscreenMediaViewer'
import { MessageActionSheet } from '../components/chat/MessageActionSheet'
import { MessageInput } from '../components/chat/MessageInput'
import { MessageList } from '../components/chat/MessageList'
import { useChatRoom } from '../context/chat-room-context'
import type { MessageRow } from '../types/message'
import type { FullscreenMediaPayload } from '../types/mediaViewer'
import type { MediaSendViewMode } from '../utils/mediaViewMode'
import { isMediaViewLocked } from '../utils/mediaLock'
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
  } = useChatRoom()

  const peerReady = Boolean(peerId)

  const mediaMessages = useMemo(
    () =>
      messages.filter(
        (m) => (m.message_type === 'image' || m.message_type === 'video') && m.media_url && !m.deleted_at,
      ),
    [messages],
  )

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
            ? `Photos and videos with ${peerUsername} — they live here, not in chat.`
            : 'Photos and videos with your partner — they live here, not in chat.'
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
