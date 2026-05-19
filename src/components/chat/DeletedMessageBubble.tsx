import { motion } from 'framer-motion'
import { Ban } from 'lucide-react'
import { formatChatTime } from '../../utils/formatChatTime'
import { cn } from '../../lib/cn'

type DeletedMessageBubbleProps = {
  created_at: string
  isOwn: boolean
  showSeen: boolean
  seen: boolean
  className?: string
}

export function DeletedMessageBubble({ created_at, isOwn, showSeen, seen, className }: DeletedMessageBubbleProps) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex w-full', isOwn ? 'justify-end' : 'justify-start', className)}
    >
      <div
        className={cn(
          'max-w-[min(100%,70%)] w-fit border-[2px] border-dashed border-nje-border/55 bg-nje-bg/90 px-2.5 py-1.5 shadow-[0_2px_0_0_rgba(90,46,30,0.04)]',
          isOwn ? 'text-right' : 'text-left',
        )}
      >
        <div className="flex items-center gap-1.5 text-nje-muted">
          <Ban className="size-3.5 shrink-0 opacity-70" strokeWidth={2.25} aria-hidden />
          <span className="text-xs font-medium italic text-nje-border/75">This message was deleted</span>
        </div>
        <div
          className={cn(
            'mt-1 flex flex-wrap items-center gap-x-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.1em] text-nje-border/55',
            isOwn ? 'justify-end' : 'justify-start',
          )}
        >
          <time dateTime={created_at}>{formatChatTime(created_at)}</time>
          {isOwn && showSeen ? (
            <span className="border-l-[2px] border-nje-border/20 pl-1.5">
              {seen ? 'Seen' : <span className="text-nje-whisper">Sent</span>}
            </span>
          ) : null}
        </div>
      </div>
    </motion.article>
  )
}
