import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'

type OnlineStatusProps = {
  online: boolean
  className?: string
}

export function OnlineStatus({ online, className }: OnlineStatusProps) {
  return (
    <motion.div
      layout
      className={cn(
        'inline-flex items-center gap-1 border-[2px] border-nje-border bg-nje-bg px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-[0.12em] text-nje-muted shadow-[0_1px_0_0_rgba(90,46,30,0.05)]',
        online && 'text-nje-border',
        className,
      )}
    >
      <span
        className={cn(
          'size-1 shrink-0 border border-nje-border',
          online ? 'bg-nje-mint' : 'bg-nje-whisper/40',
        )}
        aria-hidden
      />
      {online ? 'Here' : 'Away'}
    </motion.div>
  )
}
