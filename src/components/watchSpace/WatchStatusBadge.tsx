import { cn } from '../../lib/cn'
import type { WatchStatus } from '../../types/watchItem'

const LABEL: Record<WatchStatus, string> = {
  watch_later: 'Later',
  watching: 'Now',
  favorite: 'Love',
}

const TONE: Record<WatchStatus, string> = {
  watch_later: 'bg-nje-bg text-nje-muted',
  watching: 'bg-nje-yellow text-nje-border',
  favorite: 'bg-nje-pink text-nje-border',
}

type WatchStatusBadgeProps = {
  status: WatchStatus
  className?: string
}

export function WatchStatusBadge({ status, className }: WatchStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center border-[2px] border-nje-border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] shadow-[0_1px_0_0_rgba(90,46,30,0.08)]',
        TONE[status],
        className,
      )}
    >
      {LABEL[status]}
    </span>
  )
}
