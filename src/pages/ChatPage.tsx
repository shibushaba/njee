import { useCallback, useMemo, useState } from 'react'
import { NjeCard } from '../components/ui/NjeCard'
import { MilestonePopup } from '../components/streak/MilestonePopup'
import { ChatHeader } from '../components/chat/ChatHeader'
import { FullscreenMediaViewer } from '../components/chat/FullscreenMediaViewer'
import { MessageActionSheet } from '../components/chat/MessageActionSheet'
import { MessageInput } from '../components/chat/MessageInput'
import { MessageList } from '../components/chat/MessageList'
import { MidnightPresenceBar } from '../components/midnight/MidnightPresenceBar'
import { AmbientPresenceBar } from '../components/presence/AmbientPresenceBar'
import { useChatRoom } from '../context/chat-room-context'
import { useMessagingChrome } from '../context/messaging-chrome-context'
import { useOptionalMidnightLayer } from '../hooks/useMidnightLayer'
import { usePinnedMoments } from '../hooks/usePinnedMoments'
import { useStreak } from '../hooks/useStreak'
import { isChatThreadMedia } from '../services/mediaLifecycle.service'
import type { MessageRow } from '../types/message'
import type { FullscreenMediaPayload } from '../types/mediaViewer'
import { canOpenLimitedMedia, mediaViewLimitValue } from '../utils/limitedMediaViews'
import { isMediaViewLocked } from '../utils/mediaLock'
import type { MediaSendViewMode } from '../utils/mediaViewMode'
import type { ReplyInsertMeta } from '../utils/messageReply'
import { buildReplyInsertMeta } from '../utils/messageReply'

export function ChatPage() {
  const [composerTyping, setComposerTyping] = useState(false)
  const [replyTo, setReplyTo] = useState<MessageRow | null>(null)
  const [sheetMessage, setSheetMessage] = useState<MessageRow | null>(null)
  const [mediaViewer, setMediaViewer] = useState<FullscreenMediaPayload | null>(null)

  const messaging = useMessagingChrome()

  const {
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
    patchMessage,
    reload,
    notifyTyping,
    peerPresenceStatus,
    myPresenceStatus,
    setPresenceStatus,
  } = useChatRoom()

  const streak = useStreak(currentId, peerId)
  const pinned = usePinnedMoments(currentId, peerId, myPresenceStatus)
  const midnight = useOptionalMidnightLayer()

  const chatMessages = useMemo(
    () => messages.filter((m) => m.message_type === 'text' || isChatThreadMedia(m)),
    [messages],
  )

  const peerReady = Boolean(peerId)

  const handleTypingActivity = useCallback(
    (active: boolean) => {
      setComposerTyping(active)
      notifyTyping(active)
    },
    [notifyTyping],
  )

  const handleSendText = useCallback(
    async (text: string) => {
      const reply = replyTo ? buildReplyInsertMeta(replyTo) : undefined
      const res = await sendMessage(text, reply ? { reply } : {})
      if (!res.error) setReplyTo(null)
      return res
    },
    [replyTo, sendMessage],
  )

  const handleSendMedia = useCallback(
    async (
      file: File,
      caption: string,
      opts: { surface: 'chat' | 'memories'; viewMode: MediaSendViewMode; reply?: ReplyInsertMeta | null },
      onUploadProgress?: (pct: number) => void,
    ) => {
      const res = await sendMedia(file, caption, { ...opts, surface: 'chat' }, onUploadProgress)
      if (!res.error) setReplyTo(null)
      return res
    },
    [sendMedia],
  )

  const handleOpenMedia = useCallback(
    (payload: FullscreenMediaPayload) => {
      const row = messages.find((m) => m.id === payload.messageId)
      if (!row) return
      if (isMediaViewLocked(row)) return
      const limit = mediaViewLimitValue(row)
      if (limit != null && !canOpenLimitedMedia(row)) return
      setMediaViewer(payload)
    },
    [messages],
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
      <div className="sticky top-0 z-30 shrink-0 bg-nje-bg pb-0.5">
        <div className="overflow-hidden rounded-sm border-[2px] border-nje-border shadow-[0_2px_0_0_rgba(90,46,30,0.05)]">
          <ChatHeader
            peerUsername={peerUsername}
            ritualStreak={
              peerReady ? { count: streak.row?.current_streak ?? 0, loading: streak.loading } : undefined
            }
            inlineNotifications={messaging?.chatInlineNotifications}
            className="border-b-0 shadow-none"
          />
          {midnight?.snapshot.active ? (
            <MidnightPresenceBar
              myUsername={myUsername}
              peerUsername={peerUsername}
              peerOnline={peerOnline}
              roomConnected={roomConnected}
              peerTyping={peerTyping}
              myTyping={composerTyping}
              peerReady={peerReady}
              myPresenceStatus={myPresenceStatus}
              peerPresenceStatus={peerPresenceStatus}
              setPresenceStatus={setPresenceStatus}
              className="border-b-0 shadow-none"
            />
          ) : (
            <AmbientPresenceBar
              myUsername={myUsername}
              peerUsername={peerUsername}
              peerOnline={peerOnline}
              roomConnected={roomConnected}
              peerTyping={peerTyping}
              myTyping={composerTyping}
              peerReady={peerReady}
              myPresenceStatus={myPresenceStatus}
              peerPresenceStatus={peerPresenceStatus}
              setPresenceStatus={setPresenceStatus}
              className="border-b-0 shadow-none"
            />
          )}
        </div>
      </div>

      {error ? (
        <div className="shrink-0 px-2 pb-2 pt-1.5 sm:px-2.5">
          <NjeCard tone="surface" padding="md" className="shadow-[0_2px_0_0_rgba(90,46,30,0.05)]">
            <p className="text-sm font-semibold text-nje-border">Could not load chat</p>
            <p className="mt-1 text-xs text-nje-muted">{error}</p>
          </NjeCard>
        </div>
      ) : null}

      {!loading && !error && !peerReady ? (
        <div className="shrink-0 px-2 pb-2 pt-1.5 sm:px-2.5">
          <NjeCard tone="yellow" padding="md" className="shadow-[0_2px_0_0_rgba(90,46,30,0.05)]">
            <p className="text-sm font-semibold text-nje-border">No other profile found</p>
            <p className="mt-1 text-xs leading-relaxed text-nje-muted">
              Add a profile row in Supabase for each account so the app can resolve the other user. See supabase README in
              the repo for the exact SQL.
            </p>
          </NjeCard>
        </div>
      ) : null}

      <MessageList
        messages={chatMessages}
        currentUserId={currentId}
        peerUsername={peerUsername}
        loading={loading}
        peerReady={peerReady}
        peerTyping={peerTyping}
        onOpenMedia={handleOpenMedia}
        onOpenMessageActions={(m) => {
          if (m.deleted_at) return
          setSheetMessage(m)
        }}
        emptyVariant="chat"
        className="min-h-0"
      />

      <MessageInput
        variant="chat"
        surface="chat"
        replyTo={replyTo}
        onClearReply={() => setReplyTo(null)}
        onSend={handleSendText}
        onSendMedia={handleSendMedia}
        onTypingActivity={handleTypingActivity}
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

      <MilestonePopup tier={streak.milestone} onDismiss={streak.dismissMilestone} />

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
