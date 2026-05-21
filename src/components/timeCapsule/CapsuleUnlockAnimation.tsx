import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

type CapsuleUnlockAnimationProps = {
  active: boolean
}

/** Soft bloom when a capsule crosses from sealed to readable. */
export function CapsuleUnlockAnimation({ active }: CapsuleUnlockAnimationProps) {
  const reduceMotion = useReducedMotion()

  return (
    <AnimatePresence>
      {active && !reduceMotion ? (
        <motion.div
          key="unlock-bloom"
          initial={{ opacity: 0.55, scale: 0.92 }}
          animate={{ opacity: 0, scale: 1.35 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-br from-nje-yellow/50 via-nje-mint/25 to-transparent"
          aria-hidden
        />
      ) : null}
    </AnimatePresence>
  )
}
