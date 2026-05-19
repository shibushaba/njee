import { cn } from '../../lib/cn'

type InlineMessageReplyProps = {
  snippet: string
  /** "You" or partner name */
  authorLabel: string
  className?: string
}

export function InlineMessageReply({ snippet, authorLabel, className }: InlineMessageReplyProps) {
  return (
    <div
      className={cn(
        'mb-1.5 flex gap-2 border-l-[3px] border-nje-border/50 pl-2 text-left',
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[0.58rem] font-bold uppercase tracking-[0.1em] text-nje-whisper">{authorLabel}</p>
        <p className="truncate text-xs leading-snug text-nje-muted">{snippet}</p>
      </div>
    </div>
  )
}
