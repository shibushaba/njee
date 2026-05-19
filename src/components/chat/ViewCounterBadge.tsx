import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'
import { ViewOnceBadge } from './ViewOnceBadge'
import { ViewTwiceBadge } from './ViewTwiceBadge'

type ViewCounterBadgeProps = {
  hasLimit: boolean
  isUnlimited: boolean
  isLocked: boolean
  currentViews: number
  viewLimit: number | null
  className?: string
}

export function ViewCounterBadge({
  hasLimit,
  isUnlimited,
  isLocked,
  currentViews,
  viewLimit,
  className,
}: ViewCounterBadgeProps) {
  if (isUnlimited) {
    return (
      <span className={cn('text-[0.58rem] font-bold uppercase tracking-[0.12em] text-nje-whisper', className)}>
        Kept
      </span>
    )
  }

  if (!hasLimit || viewLimit == null) return null

  if (isLocked) {
    return (
      <motion.span
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          'inline-flex items-center border-[2px] border-nje-border/40 bg-nje-bg/80 px-1.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-nje-muted',
          className,
        )}
      >
        Closed
      </motion.span>
    )
  }

  if (viewLimit === 1) {
    return <ViewOnceBadge className={className} />
  }

  if (viewLimit === 2) {
    return <ViewTwiceBadge currentViews={currentViews} viewLimit={viewLimit} className={className} />
  }

  const left = Math.max(0, viewLimit - currentViews)
  const label =
    currentViews === 0 ? `Up to ${viewLimit}` : left === 1 ? `1 left` : `${left} left`

  return (
    <motion.span
      layout
      key={label}
      initial={{ opacity: 0, y: 1 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('text-[0.58rem] font-bold uppercase tracking-[0.12em] text-nje-whisper', className)}
    >
      {label}
    </motion.span>
  )
}
