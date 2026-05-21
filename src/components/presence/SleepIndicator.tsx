import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'

type SleepIndicatorProps = {
  active: boolean
  /** Slower easing when peer is sleeping (ambient distance). */
  distant?: boolean
  className?: string
}

export function SleepIndicator({ active, distant, className }: SleepIndicatorProps) {
  if (!active) return null

  return (
    <motion.span
      aria-hidden
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: distant ? 0.85 : 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn('inline-flex shrink-0 text-nje-border/55', className)}
    >
      <motion.span
        className="inline-flex motion-reduce:hidden"
        animate={{ rotate: [-5, 5, -5] }}
        transition={{ repeat: Infinity, duration: distant ? 12 : 7, ease: 'easeInOut' }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <title>Resting</title>
          <path
            d="M3.2 1.8A4.2 4.2 0 1 0 10.2 8.8 4.25 4.25 0 0 1 3.2 1.8Z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      </motion.span>
      <span className="hidden motion-reduce:inline-flex">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path
            d="M3.2 1.8A4.2 4.2 0 1 0 10.2 8.8 4.25 4.25 0 0 1 3.2 1.8Z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </motion.span>
  )
}
