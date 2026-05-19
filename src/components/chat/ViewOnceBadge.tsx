import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'

type ViewOnceBadgeProps = {
  className?: string
}

export function ViewOnceBadge({ className }: ViewOnceBadgeProps) {
  return (
    <motion.span
      layout
      className={cn(
        'inline-flex items-center border-[2px] border-nje-border/35 bg-nje-bg/90 px-1.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-nje-whisper',
        className,
      )}
    >
      1× open
    </motion.span>
  )
}
