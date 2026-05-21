import { useCallback, useMemo, useState } from 'react'
import { NjeCard } from '../components/ui/NjeCard'
import { MilestonePopup } from '../components/streak/MilestonePopup'
import { ChatHeader } from '../components/chat/ChatHeader'
import { MessageActionSheet } from '../components/chat/MessageActionSheet'
import { MessageInput } from '../components/chat/MessageInput'
import { MessageList } from '../components/chat/MessageList'
import { AmbientPresenceBar } from '../components/presence/AmbientPresenceBar'
import { useChatRoom } from '../context/chat-room-context'
import { useMessagingChrome } from '../context/messaging-chrome-context'
import { usePinnedMoments } from '../hooks/usePinnedMoments'
import { useStreak } from '../hooks/useStreak'
import type { MessageRow } from '../types/message'
import { buildReplyInsertMeta } from '../utils/messageReply'

export function ChatPage() {
  const [composerTyping, setComposerTyping] = useState(false)
  const [replyTo, setReplyTo] = useState<MessageRow | null>(null)
  const [sheetMessage, setSheetMessage] = useState<MessageRow | null>(null)

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
    deleteMessage,
    notifyTyping,
    peerPresenceStatus,
    myPresenceStatus,
    setPresenceStatus,
  } = useChatRoom()

  const streak = useStreak(currentId, peerId)
  const pinned = usePinnedMoments(currentId, peerId, myPresenceStatus)

  const textMessages = useMemo(() => messages.filter((m) => m.message_type === 'text'), [messages])

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
        messages={textMessages}
        currentUserId={currentId}
        peerUsername={peerUsername}
        loading={loading}
        peerReady={peerReady}
        peerTyping={peerTyping}
        onOpenMessageActions={(m) => {
          if (m.deleted_at) return
          setSheetMessage(m)
        }}
        emptyVariant="chat"
        className="min-h-0"
      />

      <MessageInput
        variant="chat"
        replyTo={replyTo}
        onClearReply={() => setReplyTo(null)}
        onSend={handleSendText}
        onTypingActivity={handleTypingActivity}
        disabled={!peerReady || Boolean(error)}
        sending={sending}
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
