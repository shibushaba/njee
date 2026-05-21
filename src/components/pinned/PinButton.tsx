import { Pin } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'

type PinButtonProps = {
  onClick: () => void
  disabled?: boolean
  busy?: boolean
  /** When set, renders as a full-width row (e.g. action sheet). */
  label?: string
  className?: string
  'aria-label'?: string
}

export function PinButton({ onClick, disabled, busy, label, className, ...rest }: PinButtonProps) {
  return (
    <motion.button
      type="button"
      whileTap={disabled || busy ? undefined : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 520, damping: 28 }}
      disabled={disabled || busy}
      onClick={onClick}
      className={cn(
        label
          ? 'flex w-full items-center gap-3 border-b-[2px] border-nje-border bg-nje-surface px-4 py-3.5 text-left text-sm font-semibold text-nje-border transition-colors hover:bg-nje-bg/80'
          : 'inline-flex size-9 items-center justify-center border-[2px] border-nje-border bg-nje-mint/70 text-nje-border shadow-[0_2px_0_0_rgba(90,46,30,0.06)]',
        disabled || busy ? 'opacity-45' : '',
        className,
      )}
      {...rest}
    >
      <Pin className="size-4 shrink-0" strokeWidth={2.25} aria-hidden />
      {label ? <span>{label}</span> : null}
    </motion.button>
  )
}
