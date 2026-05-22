import { useMemo } from 'react'
import { useOptionalMidnightLayer } from '../../hooks/useMidnightLayer'

const STAR_COUNT = 28

export function MidnightParticles() {
  const midnight = useOptionalMidnightLayer()
  const active = Boolean(midnight?.snapshot.active)
  const phase = midnight?.snapshot.phase ?? 'ease'

  const stars = useMemo(
    () =>
      Array.from({ length: STAR_COUNT }, (_, i) => ({
        id: i,
        left: `${(i * 17.7 + (i % 5) * 3) % 100}%`,
        top: `${(i * 23.1) % 78}%`,
        size: 1.1 + (i % 4) * 0.45,
        delay: `${(i * 0.19) % 5}s`,
        duration: `${10 + (i % 6) * 2.2 + (phase === 'deep' ? 4 : 0)}s`,
        opacity: 0.08 + (i % 5) * 0.035,
      })),
    [phase],
  )

  const motes = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        left: `${12 + i * 11}%`,
        bottom: `${8 + (i % 3) * 6}%`,
        delay: `${i * 0.6}s`,
        duration: `${16 + i * 1.5}s`,
      })),
    [],
  )

  if (!active) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[6] overflow-hidden" aria-hidden>
      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full bg-nje-surface"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            animation: `nje-midnight-twinkle ${s.duration} ease-in-out infinite`,
            animationDelay: s.delay,
          }}
        />
      ))}
      {motes.map((m) => (
        <span
          key={`m-${m.id}`}
          className="absolute size-1 rounded-full bg-nje-border/[0.06]"
          style={{
            left: m.left,
            bottom: m.bottom,
            animation: `nje-midnight-mote ${m.duration} ease-in-out infinite`,
            animationDelay: m.delay,
          }}
        />
      ))}
    </div>
  )
}
