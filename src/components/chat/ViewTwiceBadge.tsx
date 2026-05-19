import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'

type ViewTwiceBadgeProps = {
  currentViews: number
  viewLimit: number
  className?: string
}

export function ViewTwiceBadge({ currentViews, viewLimit, className }: ViewTwiceBadgeProps) {
  const left = Math.max(0, viewLimit - currentViews)
  const label = left === viewLimit ? `2× max` : `${left} left`
  return (
    <motion.span
      layout
      key={label}
      initial={{ opacity: 0, y: 1 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'inline-flex items-center border-[2px] border-nje-border/35 bg-nje-bg/90 px-1.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-nje-whisper',
        className,
      )}
    >
      {label}
    </motion.span>
  )
}
