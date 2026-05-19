import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import { cn } from '../../lib/cn'

type MediaLockOverlayProps = {
  className?: string
}

/**
 * Centered lock + copy over blurred media (Instagram-adjacent, calm).
 */
export function MediaLockOverlay({ className }: MediaLockOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 px-3 text-center',
        'bg-nje-border/[0.12]',
        className,
      )}
      aria-hidden
    >
      <span className="flex size-9 items-center justify-center border-[2px] border-nje-border/60 bg-nje-surface/85 text-nje-muted shadow-[var(--shadow-nje-flat-sm)]">
        <Lock className="size-4" strokeWidth={2.25} aria-hidden />
      </span>
      <p className="max-w-[11rem] text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-nje-border">View limit reached</p>
      <p className="max-w-[12rem] text-[0.62rem] leading-snug text-nje-muted">No more opens</p>
    </motion.div>
  )
}
