import { motion } from 'framer-motion'
import { useMemo } from 'react'
import type { MoodWeatherSnapshot } from '../../types/moodWeather'

type MoodWeatherOverlayProps = {
  snapshot: MoodWeatherSnapshot
  reduceMotion: boolean
}

export function MoodWeatherOverlay({ snapshot, reduceMotion }: MoodWeatherOverlayProps) {
  const style = useMemo(
    () => ({
      backgroundImage: `radial-gradient(120% 85% at 50% 0%, transparent 35%, rgba(45,24,16,${
        0.12 + snapshot.vignette * 0.55
      }) 100%), radial-gradient(90% 60% at 50% 100%, rgba(242,193,78,${
        0.04 + snapshot.warmth * 0.12 * snapshot.intensity
      }) 0%, transparent 55%)`,
    }),
    [snapshot.intensity, snapshot.vignette, snapshot.warmth],
  )

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[3]"
      style={style}
      initial={false}
      animate={{
        opacity: 0.38 + snapshot.haze * 0.42,
      }}
      transition={{ duration: reduceMotion ? 0.15 : 1.1 * snapshot.tempoScale, ease: [0.22, 1, 0.36, 1] }}
    />
  )
}
