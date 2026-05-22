import { Moon } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { MidnightPhase } from '../../types/midnightLayer'

const PHASE_LABEL: Record<MidnightPhase, string> = {
  edge: 'After twelve',
  deep: 'Deep night',
  ease: 'Almost dawn',
}

type MidnightIndicatorProps = {
  phase: MidnightPhase
  className?: string
  variant?: 'pill' | 'card'
}

export function MidnightIndicator({ phase, className, variant = 'pill' }: MidnightIndicatorProps) {
  const label = PHASE_LABEL[phase]

  if (variant === 'card') {
    return (
      <div
        className={cn(
          'flex items-start gap-3 border-[2px] border-nje-border/80 bg-nje-surface/90 px-4 py-3 shadow-[0_2px_0_0_rgba(90,46,30,0.05)] backdrop-blur-[1px]',
          className,
        )}
      >
        <span className="flex size-11 shrink-0 items-center justify-center border-[2px] border-nje-border/70 bg-nje-bg/80 text-nje-border">
          <Moon className="size-5" strokeWidth={2.25} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-nje-whisper">Midnight layer</p>
          <p className="mt-0.5 text-sm font-bold text-nje-border">{label}</p>
          <p className="mt-1 text-xs leading-relaxed text-nje-muted">
            The room is softer until morning — slower motion, dimmer chrome, a little starlight at the edges.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'inline-flex max-w-full items-center gap-2 border-[2px] border-nje-border/70 bg-nje-surface/90 px-2.5 py-1.5 shadow-[0_2px_0_0_rgba(90,46,30,0.04)] backdrop-blur-[1px]',
        className,
      )}
    >
      <Moon className="size-3.5 shrink-0 text-nje-border/90" strokeWidth={2.25} aria-hidden />
      <span className="truncate text-[0.62rem] font-bold uppercase tracking-[0.14em] text-nje-border/90">{label}</span>
    </div>
  )
}
