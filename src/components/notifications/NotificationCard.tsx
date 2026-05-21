import { MessageSquare, ImageIcon, Flame, Gift, FolderHeart, Circle } from 'lucide-react'
import type { NotificationRow } from '../../types/notification'
import { cn } from '../../lib/cn'
import { formatNotificationTime, notificationKindLabel } from '../../utils/notificationDisplay'

const ICONS = {
  message: MessageSquare,
  media: ImageIcon,
  streak: Flame,
  time_capsule: Gift,
  shared_collection: FolderHeart,
  presence: Circle,
} as const

type NotificationCardProps = {
  row: NotificationRow
  onOpen: (row: NotificationRow) => void
  className?: string
}

export function NotificationCard({ row, onOpen, className }: NotificationCardProps) {
  const Icon = ICONS[row.kind] ?? MessageSquare
  const unread = !row.read_at

  return (
    <button
      type="button"
      onClick={() => onOpen(row)}
      className={cn(
        'flex w-full gap-2.5 border-b-[2px] border-nje-border/15 px-3 py-2.5 text-left transition-colors hover:bg-nje-bg/50 motion-safe:transition-colors',
        unread && 'bg-nje-yellow/12',
        className,
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border-[2px] border-nje-border bg-nje-surface shadow-[0_2px_0_0_rgba(90,46,30,0.06)]',
          unread ? 'bg-nje-mint/35' : 'opacity-80',
        )}
      >
        <Icon className="h-4 w-4 text-nje-border" strokeWidth={2.25} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-nje-whisper">
            {notificationKindLabel(row.kind)}
          </span>
          <time className="shrink-0 text-[0.58rem] font-semibold text-nje-muted" dateTime={row.created_at}>
            {formatNotificationTime(row.created_at)}
          </time>
        </span>
        <span className="mt-0.5 block text-sm font-bold leading-snug text-nje-border">{row.title}</span>
        {row.body ? (
          <span className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-nje-muted">{row.body}</span>
        ) : null}
      </span>
    </button>
  )
}
