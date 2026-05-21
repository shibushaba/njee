import { cn } from '../../lib/cn'
import type { PresenceStatusId } from '../../types/presenceStatus'
import { PRESENCE_LABEL, presenceRowTone } from '../../utils/presenceStatusMeta'

type PresenceBadgeProps = {
  status: PresenceStatusId
  className?: string
}

export function PresenceBadge({ status, className }: PresenceBadgeProps) {
  const row = presenceRowTone(status)
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]',
        row === 'night' && 'border-nje-border/35 bg-nje-bg/55 text-nje-border/80',
        row === 'focus' && 'border-nje-border/40 bg-nje-surface/80 text-nje-muted',
        row === 'default' && 'border-nje-border/30 bg-nje-bg/35 text-nje-muted',
        className,
      )}
    >
      <span className="truncate">{PRESENCE_LABEL[status]}</span>
    </span>
  )
}
