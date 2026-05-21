import { Bell } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { ChatInlineNotifications } from '../../context/messaging-chrome-context'
import { NotificationBadge } from '../notifications/NotificationBadge'
import { StreakFlame } from '../streak/StreakFlame'

type ChatHeaderProps = {
  peerUsername: string | null
  /** When set (e.g. peer resolved), shows compact ritual flame + count. */
  ritualStreak?: { count: number; loading: boolean }
  /** On chat: bell sits inside this header, right of streak (shell hides floating bell). */
  inlineNotifications?: ChatInlineNotifications
  className?: string
}

export function ChatHeader({ peerUsername, ritualStreak, inlineNotifications, className }: ChatHeaderProps) {
  const peer = peerUsername?.trim()
  const title = peer && peer.length > 0 ? peer : 'Chat'

  return (
    <header
      className={cn(
        'flex shrink-0 items-center gap-2 border-b-[2px] border-nje-border bg-nje-surface px-3 py-2 shadow-[0_2px_0_0_rgba(90,46,30,0.05)] sm:px-3.5',
        className,
      )}
    >
      <h1 className="min-w-0 flex-1 truncate text-base font-bold leading-tight tracking-tight text-nje-border sm:text-lg">
        {title}
      </h1>
      <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
        {ritualStreak ? (
          <StreakFlame
            count={ritualStreak.count}
            loading={ritualStreak.loading}
            size="sm"
            className="-translate-x-0.5 sm:-translate-x-1"
          />
        ) : null}
        {inlineNotifications ? (
          <button
            type="button"
            aria-label={
              inlineNotifications.unreadCount > 0
                ? `Notifications, ${inlineNotifications.unreadCount} unread`
                : 'Notifications'
            }
            onClick={inlineNotifications.open}
            className="relative flex h-9 w-9 shrink-0 items-center justify-center border-[2px] border-nje-border bg-nje-bg shadow-[0_2px_0_0_rgba(90,46,30,0.06)] transition-shadow hover:shadow-[0_3px_0_0_rgba(90,46,30,0.08)] motion-safe:active:translate-y-px sm:h-10 sm:w-10"
          >
            <Bell className="h-[1.05rem] w-[1.05rem] text-nje-border sm:h-[1.15rem] sm:w-[1.15rem]" strokeWidth={2.25} />
            <NotificationBadge count={inlineNotifications.unreadCount} />
          </button>
        ) : null}
      </div>
    </header>
  )
}
