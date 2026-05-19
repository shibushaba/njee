import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import type { MessageRow } from '../../types/message'
import type { FullscreenMediaPayload } from '../../types/mediaViewer'
import { cn } from '../../lib/cn'
import { EmptyChatState } from './EmptyChatState'
import { MessageCard } from './MessageCard'
import { ThreadTypingBubble } from './ThreadTypingBubble'

type MessageListProps = {
  messages: MessageRow[]
  currentUserId: string | null
  peerUsername: string | null
  loading: boolean
  peerReady: boolean
  /** Live typing from the other person (thread bubble, chat only). */
  peerTyping?: boolean
  /** When set, opens fullscreen media (Memories thread). Omit on chat (text-only). */
  onOpenMedia?: (payload: FullscreenMediaPayload) => void
  onOpenMessageActions?: (message: MessageRow) => void
  /** Chat default: standard empty state. Memories: short hint when no media yet. */
  emptyVariant?: 'chat' | 'memories'
  className?: string
}

export function MessageList({
  messages,
  currentUserId,
  peerUsername,
  loading,
  peerReady,
  peerTyping = false,
  onOpenMedia,
  onOpenMessageActions,
  emptyVariant = 'chat',
  className,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' })
  }, [messages])

  useEffect(() => {
    if (!peerTyping) return
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [peerTyping])

  const lastOwnId = [...messages].reverse().find((m) => m.sender_id === currentUserId)?.id

  const showEmpty = !loading && peerReady && messages.length === 0 && !peerTyping

  return (
    <div
      className={cn(
        'min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-2 py-2 sm:px-2.5 sm:py-2.5',
        className,
      )}
    >
      {loading ? (
        <div className="space-y-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-11 max-w-[70%] animate-pulse border-[2px] border-nje-border bg-nje-surface/80"
              aria-hidden
            />
          ))}
        </div>
      ) : null}

      {showEmpty && emptyVariant === 'chat' ? (
        <div className="flex min-h-[36vh] items-center justify-center px-1">
          <EmptyChatState />
        </div>
      ) : null}

      {showEmpty && emptyVariant === 'memories' ? (
        <div className="flex min-h-[28vh] items-center justify-center px-2">
          <p className="max-w-xs text-center text-sm leading-relaxed text-nje-muted">
            No photos or videos yet. Add one below — they stay here, not in the chat thread.
          </p>
        </div>
      ) : null}

      {!loading && messages.length > 0 ? (
        <ul className="flex flex-col pb-1">
          {messages.map((m, i) => {
            const prev = i > 0 ? messages[i - 1] : null
            const groupedWithPrev = Boolean(prev && prev.sender_id === m.sender_id)
            return (
              <li key={m.id} className={cn(!groupedWithPrev && i > 0 ? 'mt-2.5' : groupedWithPrev ? 'mt-1' : '')}>
                <MessageCard
                  message={m}
                  isOwn={m.sender_id === currentUserId}
                  showSeen={m.id === lastOwnId}
                  currentUserId={currentUserId}
                  peerUsername={peerUsername}
                  onOpenMedia={onOpenMedia}
                  onOpenActions={onOpenMessageActions}
                />
              </li>
            )
          })}
        </ul>
      ) : null}

      {peerReady && !loading && emptyVariant === 'chat' ? (
        <AnimatePresence initial={false}>
          {peerTyping ? (
            <motion.div
              key="thread-typing"
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className={cn(messages.length > 0 ? 'mt-2' : 'mt-1')}
            >
              <ThreadTypingBubble />
            </motion.div>
          ) : null}
        </AnimatePresence>
      ) : null}

      <div ref={bottomRef} aria-hidden className="h-px w-full shrink-0 scroll-mt-4" />
    </div>
  )
}
