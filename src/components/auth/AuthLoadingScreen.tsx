import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'

type AuthLoadingScreenProps = {
  message?: string
  className?: string
}

export function AuthLoadingScreen({
  message = 'Loading…',
  className,
}: AuthLoadingScreenProps) {
  return (
    <div
      className={cn(
        'flex min-h-dvh flex-1 items-center justify-center bg-nje-bg px-gutter py-stack-xl',
        className,
      )}
    >
      <motion.div
        role="status"
        aria-live="polite"
        className="w-full max-w-sm border-[3px] border-nje-border bg-nje-surface px-gutter-md py-stack-lg shadow-[var(--shadow-nje-flat-sm)]"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-nje-muted">
          {message}
        </p>
      </motion.div>
    </div>
  )
}
