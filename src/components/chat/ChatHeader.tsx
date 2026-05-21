import { cn } from '../../lib/cn'
import { StreakFlame } from '../streak/StreakFlame'

type ChatHeaderProps = {
  peerUsername: string | null
  /** When set (e.g. peer resolved), shows compact ritual flame + count. */
  ritualStreak?: { count: number; loading: boolean }
  className?: string
}

export function ChatHeader({ peerUsername, ritualStreak, className }: ChatHeaderProps) {
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
      {ritualStreak ? (
        <StreakFlame count={ritualStreak.count} loading={ritualStreak.loading} size="sm" />
      ) : null}
    </header>
  )
}
