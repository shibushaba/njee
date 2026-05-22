import { useMemo } from 'react'
import { cn } from '../../lib/cn'
import type { MoodWeatherSnapshot } from '../../types/moodWeather'

type AmbientParticlesProps = {
  snapshot: MoodWeatherSnapshot
}

const RAIN_COUNT = 14
const DUST_COUNT = 18
const EMBER_COUNT = 10

export function AmbientParticles({ snapshot }: AmbientParticlesProps) {
  const kind = snapshot.particleKind
  const tempo = snapshot.tempoScale

  const rain = useMemo(
    () =>
      Array.from({ length: RAIN_COUNT }, (_, i) => ({
        id: i,
        left: `${(i * 7.3) % 100}%`,
        delay: `${(i * 0.31) % 4}s`,
        duration: `${2.8 + (i % 5) * 0.35 * tempo}s`,
        opacity: 0.08 + (i % 4) * 0.03,
      })),
    [tempo],
  )

  const dust = useMemo(
    () =>
      Array.from({ length: DUST_COUNT }, (_, i) => ({
        id: i,
        left: `${(i * 11) % 100}%`,
        top: `${(i * 13) % 100}%`,
        delay: `${(i * 0.47) % 6}s`,
        duration: `${14 + (i % 7) * 2 * tempo}s`,
        size: 1.5 + (i % 3) * 0.6,
      })),
    [tempo],
  )

  const embers = useMemo(
    () =>
      Array.from({ length: EMBER_COUNT }, (_, i) => ({
        id: i,
        left: `${8 + (i * 9.2) % 84}%`,
        delay: `${(i * 0.41) % 5}s`,
        duration: `${5 + (i % 4) * 0.9 * tempo}s`,
      })),
    [tempo],
  )

  if (kind === 'none') return null

  if (kind === 'rain') {
    return (
      <div className="pointer-events-none fixed inset-0 z-[4] overflow-hidden" aria-hidden>
        {rain.map((d) => (
          <span
            key={d.id}
            className="absolute top-[-12%] h-[18vh] w-px origin-top bg-nje-border/35"
            style={{
              left: d.left,
              opacity: d.opacity,
              animation: `nje-mood-rain ${d.duration} linear infinite`,
              animationDelay: d.delay,
            }}
          />
        ))}
      </div>
    )
  }

  if (kind === 'ember') {
    return (
      <div className="pointer-events-none fixed inset-0 z-[4] overflow-hidden" aria-hidden>
        {embers.map((e) => (
          <span
            key={e.id}
            className="absolute bottom-[-5%] size-1 rounded-full bg-nje-yellow/50"
            style={{
              left: e.left,
              animation: `nje-mood-ember ${e.duration} ease-out infinite`,
              animationDelay: e.delay,
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className={cn('pointer-events-none fixed inset-0 z-[4] overflow-hidden')} aria-hidden>
      {dust.map((d) => (
        <span
          key={d.id}
          className="absolute rounded-full bg-nje-border/[0.07]"
          style={{
            left: d.left,
            top: d.top,
            width: d.size,
            height: d.size,
            animation: `nje-mood-dust ${d.duration} ease-in-out infinite`,
            animationDelay: d.delay,
          }}
        />
      ))}
    </div>
  )
}
