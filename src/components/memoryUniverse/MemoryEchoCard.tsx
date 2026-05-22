import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { MemoryEchoItem } from '../../types/memoryEcho'
import { cn } from '../../lib/cn'
import { echoKindLabel } from '../../utils/buildMemoryEchoes'
import { formatChatDateDividerLabel } from '../../utils/formatChatDateDivider'

type MemoryEchoCardProps = {
  item: MemoryEchoItem
  className?: string
}

export function MemoryEchoCard({ item, className }: MemoryEchoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        to={item.navigateTo}
        className={cn(
          'group block rounded-none border-[2px] border-nje-border bg-nje-surface/95 px-3.5 py-3 shadow-[var(--shadow-nje-flat-sm)] transition-[box-shadow,transform] duration-200',
          'hover:shadow-[0_0_0_1px_rgba(90,46,30,0.06),0_6px_22px_rgba(40,28,20,0.08)] motion-safe:hover:-translate-y-px',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nje-border',
          className,
        )}
      >
        <p className="text-[0.58rem] font-bold uppercase tracking-[0.2em] text-nje-muted">
          {echoKindLabel(item.kind)} · {formatChatDateDividerLabel(item.at)}
        </p>
        <p className="mt-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-nje-whisper">{item.contextLine}</p>
        <p className="mt-2 font-serif text-base font-semibold leading-snug text-nje-border">{item.title}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-nje-muted">{item.body}</p>
      </Link>
    </motion.div>
  )
}
