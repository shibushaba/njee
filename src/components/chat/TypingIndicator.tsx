import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '../../lib/cn'

type TypingIndicatorProps = {
  className?: string
}

export function TypingIndicator({ className }: TypingIndicatorProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 2 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 2 }}
      transition={{ duration: 0.2 }}
      className={cn('flex items-center gap-0.5', className)}
      role="status"
      aria-label="Typing"
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1 border-[2px] border-nje-border bg-nje-yellow"
          animate={
            reduceMotion
              ? { opacity: [0.35, 1, 0.35] }
              : { y: [0, -2, 0], opacity: [0.45, 1, 0.45] }
          }
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: reduceMotion ? 1.1 : 0.75,
            ease: 'easeInOut',
            delay: i * 0.1,
          }}
        />
      ))}
    </motion.div>
  )
}
