import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

const STARS = [
  { t: '8%', l: '12%', o: 0.35 },
  { t: '18%', l: '78%', o: 0.28 },
  { t: '34%', l: '44%', o: 0.22 },
  { t: '52%', l: '18%', o: 0.3 },
  { t: '62%', l: '86%', o: 0.2 },
  { t: '78%', l: '52%', o: 0.26 },
  { t: '12%', l: '58%', o: 0.18 },
]

type MemoryGalaxyProps = {
  children: ReactNode
  className?: string
  /** Stronger vignette when midnight layer is active. */
  midnight?: boolean
}

export function MemoryGalaxy({ children, className, midnight }: MemoryGalaxyProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-none border-[3px] border-nje-border',
        'bg-[radial-gradient(120%_90%_at_50%_40%,rgba(42,36,32,0.06)_0%,rgba(18,16,14,0.92)_72%,rgba(10,9,8,0.96)_100%)]',
        midnight ? 'shadow-[inset_0_0_80px_rgba(0,0,0,0.35)]' : 'shadow-[inset_0_0_60px_rgba(0,0,0,0.2)]',
        className,
      )}
    >
      {STARS.map((s, i) => (
        <span
          key={i}
          className="pointer-events-none absolute size-0.5 rounded-full bg-nje-surface"
          style={{ top: s.t, left: s.l, opacity: s.o }}
          aria-hidden
        />
      ))}
      <div className="relative z-[1]">{children}</div>
    </div>
  )
}
