import { cn } from '../../lib/cn'
import type { DailyStreakRow } from '../../types/streak'
import { formatStreakDate, nextMilestoneAfter } from '../../utils/streakUtils'
import { StreakFlame } from './StreakFlame'

type StreakCardProps = {
  row: DailyStreakRow | null
  loading: boolean
  className?: string
}

/** Ritual page: flame + quiet captions (chat uses header `StreakFlame` only). */
export function StreakCard({ row, loading, className }: StreakCardProps) {
  const streak = row?.current_streak ?? 0
  const last = formatStreakDate(row?.last_completed_date ?? null)
  const next = nextMilestoneAfter(streak)

  return (
    <section
      className={cn(
        'flex flex-col items-center gap-stack-md border-[2px] border-nje-border bg-nje-surface/90 px-4 py-stack-lg text-center shadow-[0_2px_0_0_rgba(90,46,30,0.05)]',
        className,
      )}
      aria-label="Daily ritual streak"
    >
      <StreakFlame count={streak} loading={loading} size="md" />
      {!loading ? (
        <div className="max-w-xs space-y-2">
          <p className="text-[0.58rem] font-bold uppercase tracking-[0.2em] text-nje-whisper">Daily ritual</p>
          {last ? (
            <p className="text-xs leading-relaxed text-nje-muted">
              Last shared day: <span className="font-semibold text-nje-border/90">{last}</span>
            </p>
          ) : (
            <p className="text-xs leading-relaxed text-nje-muted">When you both send a message the same day (UTC), the flame warms.</p>
          )}
          {next && streak > 0 ? (
            <p className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-nje-whisper">Next quiet mark · {next}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
