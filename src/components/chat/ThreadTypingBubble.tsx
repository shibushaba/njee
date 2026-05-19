import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '../../lib/cn'

/**
 * Incoming-message style bubble with three floating dots (thread bottom, like Instagram DMs).
 */
export function ThreadTypingBubble({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion()

  return (
    <div className={cn('flex w-full touch-pan-y justify-start', className)}>
      <div
        className={cn(
          'flex max-w-[min(100%,70%)] items-center gap-1.5 border-[2px] border-nje-border bg-nje-pink px-3.5 py-2.5 shadow-[0_2px_0_0_rgba(90,46,30,0.05)]',
          'rounded-2xl rounded-bl-md',
        )}
        role="status"
        aria-live="polite"
        aria-label="Typing a message"
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-2 rounded-full bg-nje-border/60"
            animate={
              reduceMotion
                ? { opacity: [0.35, 1, 0.35] }
                : { y: [0, -7, 0], opacity: [0.45, 1, 0.55] }
            }
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: reduceMotion ? 1.15 : 0.85,
              ease: 'easeInOut',
              delay: i * 0.14,
            }}
          />
        ))}
      </div>
    </div>
  )
}
