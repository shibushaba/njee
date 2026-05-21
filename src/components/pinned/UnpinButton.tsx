import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'

type UnpinButtonProps = {
  onClick: () => void
  disabled?: boolean
  busy?: boolean
  className?: string
}

export function UnpinButton({ onClick, disabled, busy, className }: UnpinButtonProps) {
  return (
    <motion.button
      type="button"
      whileTap={disabled || busy ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 480, damping: 26 }}
      disabled={disabled || busy}
      onClick={onClick}
      className={cn(
        'rounded-sm border border-nje-border/40 bg-nje-bg/60 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-nje-muted shadow-[0_1px_0_0_rgba(90,46,30,0.04)] transition hover:border-nje-border/55 hover:text-nje-border disabled:opacity-45',
        className,
      )}
    >
      {busy ? '…' : 'Release'}
    </motion.button>
  )
}
