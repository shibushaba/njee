import { useCallback } from 'react'
import { motion } from 'framer-motion'
import type { MessageRow } from '../../types/message'
import type { FullscreenMediaPayload } from '../../types/mediaViewer'
import { formatChatTime } from '../../utils/formatChatTime'
import { cn } from '../../lib/cn'
import { useLongPress } from '../../hooks/useLongPress'
import { DeletedMessageBubble } from './DeletedMessageBubble'
import { InlineMessageReply } from './InlineMessageReply'
import { MediaMessageCard } from './MediaMessageCard'

type MessageCardProps = {
  message: MessageRow
  isOwn: boolean
  showSeen: boolean
  currentUserId: string | null
  peerUsername: string | null
  /** Provided on Memories route only — renders image/video bubbles. */
  onOpenMedia?: (payload: FullscreenMediaPayload) => void
  onOpenActions?: (message: MessageRow) => void
}

export function MessageCard({
  message,
  isOwn,
  showSeen,
  currentUserId,
  peerUsername,
  onOpenMedia,
  onOpenActions,
}: MessageCardProps) {
  const openMenu = useCallback(() => {
    onOpenActions?.(message)
  }, [message, onOpenActions])

  const longPress = useLongPress(() => {
    openMenu()
  })

  if (message.deleted_at) {
    return (
      <DeletedMessageBubble
        created_at={message.created_at}
        isOwn={isOwn}
        showSeen={showSeen}
        seen={message.seen}
      />
    )
  }

  if (message.message_type !== 'text' && message.media_url && onOpenMedia) {
    return (
      <MediaMessageCard
        message={message}
        isOwn={isOwn}
        showSeen={showSeen}
        currentUserId={currentUserId}
        peerUsername={peerUsername}
        onOpenMedia={onOpenMedia}
        onOpenActions={onOpenActions}
      />
    )
  }

  const replyAuthor =
    message.reply_sender_id && currentUserId && message.reply_sender_id === currentUserId
      ? 'You'
      : (peerUsername ?? 'Partner')

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className={cn('flex w-full touch-pan-y', isOwn ? 'justify-end' : 'justify-start')}
      {...longPress}
      onContextMenu={(e) => {
        e.preventDefault()
        openMenu()
      }}
    >
      <div
        className={cn(
          'max-w-[min(100%,70%)] w-fit border-[2px] border-nje-border px-2.5 py-1.5 shadow-[0_2px_0_0_rgba(90,46,30,0.05)]',
          isOwn ? 'bg-nje-yellow' : 'bg-nje-pink',
        )}
      >
        {message.reply_to_message_id && message.reply_snippet ? (
          <InlineMessageReply snippet={message.reply_snippet} authorLabel={replyAuthor} />
        ) : null}
        <p className="whitespace-pre-wrap break-words text-sm leading-snug text-nje-border">{message.content}</p>
        <div
          className={cn(
            'mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.1em] text-nje-border/70',
            isOwn ? 'justify-end' : 'justify-start',
          )}
        >
          <time dateTime={message.created_at}>{formatChatTime(message.created_at)}</time>
          {isOwn && showSeen ? (
            <span className="border-l-[2px] border-nje-border/25 pl-1.5">
              {message.seen ? 'Seen' : <span className="text-nje-whisper">Sent</span>}
            </span>
          ) : null}
        </div>
      </div>
    </motion.article>
  )
}
