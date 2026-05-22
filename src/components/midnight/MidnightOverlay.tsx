import { motion, useReducedMotion } from 'framer-motion'
import { useOptionalMidnightLayer } from '../../hooks/useMidnightLayer'

export function MidnightOverlay() {
  const midnight = useOptionalMidnightLayer()
  const reduceMotion = useReducedMotion()
  const active = Boolean(midnight?.snapshot.active)
  const phase = midnight?.snapshot.phase ?? 'ease'

  const depth = phase === 'deep' ? 0.22 : phase === 'edge' ? 0.16 : 0.12

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[5] mix-blend-multiply"
      initial={false}
      animate={{
        opacity: active ? 0.55 + depth : 0,
        background: active
          ? `radial-gradient(95% 70% at 50% -5%, rgba(255,246,232,${0.04 + depth * 0.08}) 0%, transparent 42%),
             radial-gradient(120% 90% at 50% 100%, rgba(45,24,16,${0.18 + depth * 0.35}) 0%, transparent 55%),
             linear-gradient(180deg, rgba(90,46,30,${0.06 + depth * 0.12}) 0%, rgba(245,217,166,0.08) 100%)`
          : 'transparent',
      }}
      transition={{
        duration: reduceMotion ? 0.2 : 1.45,
        ease: [0.22, 1, 0.36, 1],
      }}
    />
  )
}
