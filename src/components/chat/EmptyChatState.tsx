import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'

export function EmptyChatState({ className }: { className?: string }) {
  return (
    <motion.div
      role="status"
      className={cn(
        'mx-auto flex max-w-[min(100%,18rem)] flex-col gap-2 border-[2px] border-nje-border bg-nje-bg px-3 py-3 text-center shadow-[0_2px_0_0_rgba(90,46,30,0.05)]',
        className,
      )}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-nje-whisper">Empty thread</p>
      <p className="text-xs leading-relaxed text-nje-muted">Send a message — it will show up here.</p>
    </motion.div>
  )
}
