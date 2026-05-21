import { cn } from '../../lib/cn'

type NotificationBadgeProps = {
  count: number
  className?: string
}

export function NotificationBadge({ count, className }: NotificationBadgeProps) {
  if (count <= 0) return null
  const label = count > 9 ? '9+' : String(count)
  return (
    <span
      className={cn(
        'pointer-events-none absolute -right-0.5 -top-0.5 flex min-w-[1rem] items-center justify-center rounded-sm border-[2px] border-nje-border bg-nje-yellow px-[3px] py-px text-[0.55rem] font-bold tabular-nums leading-none text-nje-border',
        className,
      )}
      aria-hidden
    >
      {label}
    </span>
  )
}
