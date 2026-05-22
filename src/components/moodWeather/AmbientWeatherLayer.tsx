import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { cn } from '../../lib/cn'
import type { MoodWeatherSnapshot } from '../../types/moodWeather'
import { moodWeatherGradient } from '../../utils/moodWeatherEngine'

type AmbientWeatherLayerProps = {
  snapshot: MoodWeatherSnapshot
  reduceMotion: boolean
}

export function AmbientWeatherLayer({ snapshot, reduceMotion }: AmbientWeatherLayerProps) {
  const gradient = useMemo(() => moodWeatherGradient(snapshot), [snapshot])

  return (
    <motion.div
      aria-hidden
      className={cn(
        'pointer-events-none fixed inset-0 z-[2]',
        'mix-blend-multiply',
      )}
      initial={false}
      animate={{
        opacity: 0.55 + snapshot.intensity * 0.22,
        background: gradient,
      }}
      transition={{
        duration: reduceMotion ? 0.2 : 1.35 * snapshot.tempoScale,
        ease: [0.22, 1, 0.36, 1],
      }}
    />
  )
}
