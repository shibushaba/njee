import type { WatchPortalStatus } from '../../types/watchItem'
import { cn } from '../../lib/cn'

const LABEL: Record<WatchPortalStatus, string> = {
  suggested: 'Queued',
  watching: 'Watching',
  watched: 'Watched',
}

const TONE: Record<WatchPortalStatus, string> = {
  suggested: 'bg-nje-bg text-nje-muted',
  watching: 'bg-nje-yellow text-nje-border',
  watched: 'bg-nje-mint text-nje-border',
}

type WatchStatusBadgeProps = {
  status: WatchPortalStatus
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
