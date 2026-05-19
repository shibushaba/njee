import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'

type UploadProgressProps = {
  progress: number
  className?: string
}

export function UploadProgress({ progress, className }: UploadProgressProps) {
  const clamped = Math.max(0, Math.min(100, progress))
  return (
    <div
      className={cn(
        'overflow-hidden border-[3px] border-nje-border bg-nje-bg shadow-[var(--shadow-nje-flat-sm)]',
        className,
      )}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Upload progress"
    >
      <div className="h-2 w-full bg-nje-surface">
        <motion.div
          className="h-full bg-nje-mint"
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        />
      </div>
      <p className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-nje-muted">Uploading… {clamped}%</p>
    </div>
  )
}
