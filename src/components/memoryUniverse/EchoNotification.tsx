import { Sparkles } from 'lucide-react'
import { cn } from '../../lib/cn'

type EchoNotificationProps = {
  /** Short line shown under the title, e.g. first echo context. */
  hint?: string | null
  className?: string
}

export function EchoNotification({ hint, className }: EchoNotificationProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-none border-[2px] border-nje-border bg-nje-bg/90 px-3 py-2.5 shadow-[var(--shadow-nje-flat-sm)]',
        className,
      )}
      role="status"
    >
      <span className="flex size-9 shrink-0 items-center justify-center border-[2px] border-nje-border bg-nje-surface text-nje-border shadow-[var(--shadow-nje-flat-sm)]">
        <Sparkles className="size-4" strokeWidth={2.25} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-nje-muted">Soft echo</p>
        <p className="mt-0.5 text-sm font-semibold leading-snug text-nje-border">Something from the quiet is surfacing.</p>
        {hint ? <p className="mt-1 text-xs leading-relaxed text-nje-muted">{hint}</p> : null}
      </div>
    </div>
  )
}
