import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { StreakMilestone } from '../../types/streak'
import { cn } from '../../lib/cn'

const COPY: Record<StreakMilestone, { title: string; body: string }> = {
  7: {
    title: 'A week together',
    body: 'Seven gentle days of showing up for each other. That is its own kind of home.',
  },
  30: {
    title: 'A month of showing up',
    body: 'Thirty sunrises where you both reached out. Let it feel soft, not loud.',
  },
  100: {
    title: 'One hundred days',
    body: 'A quiet river of small hellos. This number is only a bookmark for something deeper.',
  },
  365: {
    title: 'A full turn of the year',
    body: 'Three hundred and sixty-five shared days. Breathe it in slowly.',
  },
}

type MilestonePopupProps = {
  tier: StreakMilestone | null
  onDismiss: () => void
  className?: string
}

export function MilestonePopup({ tier, onDismiss, className }: MilestonePopupProps) {
  const reduceMotion = useReducedMotion()

  return (
    <AnimatePresence>
      {tier ? (
        <motion.div
          key={tier}
          role="dialog"
          aria-modal
          aria-labelledby="milestone-title"
          className={cn('fixed inset-0 z-[200] flex items-end justify-center p-3 sm:items-center', className)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.12 : 0.22 }}
        >
          <motion.button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-nje-border/25 backdrop-blur-[1px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onDismiss}
          />
          <motion.div
            className="relative z-10 w-full max-w-sm border-[3px] border-nje-border bg-nje-surface px-5 py-6 shadow-[var(--shadow-nje-flat)]"
            initial={reduceMotion ? false : { y: 18, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { y: 10, opacity: 0, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0.15 : 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <p id="milestone-title" className="text-[0.58rem] font-bold uppercase tracking-[0.22em] text-nje-whisper">
              Ritual
            </p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-nje-border sm:text-2xl">{COPY[tier].title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-nje-muted">{COPY[tier].body}</p>
            <button
              type="button"
              onClick={onDismiss}
              className="mt-6 w-full border-[2px] border-nje-border bg-nje-mint py-2.5 text-sm font-bold uppercase tracking-[0.12em] text-nje-border shadow-[0_2px_0_0_rgba(90,46,30,0.06)] transition-shadow hover:shadow-[0_3px_0_0_rgba(90,46,30,0.08)]"
            >
              Hold this quietly
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
