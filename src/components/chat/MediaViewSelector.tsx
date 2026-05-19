import { motion } from 'framer-motion'
import type { MediaSendViewMode } from '../../utils/mediaViewMode'
import { sendModeLabel } from '../../utils/mediaViewMode'
import { cn } from '../../lib/cn'

const MODES: MediaSendViewMode[] = ['once', 'twice', 'unlimited']

type MediaViewSelectorProps = {
  value: MediaSendViewMode
  onChange: (mode: MediaSendViewMode) => void
  disabled?: boolean
  className?: string
}

export function MediaViewSelector({ value, onChange, disabled, className }: MediaViewSelectorProps) {
  return (
    <div className={cn('flex flex-wrap gap-1', className)} role="radiogroup" aria-label="How long the media stays visible">
      {MODES.map((mode) => {
        const active = value === mode
        return (
          <motion.button
            key={mode}
            type="button"
            layout
            disabled={disabled}
            onClick={() => onChange(mode)}
            className={cn(
              'border-[2px] px-2 py-1 text-[0.58rem] font-bold uppercase tracking-[0.12em] shadow-[0_2px_0_0_rgba(90,46,30,0.05)] transition-[transform,box-shadow] duration-150',
              active
                ? 'border-nje-border bg-nje-mint text-nje-border'
                : 'border-nje-border bg-nje-bg text-nje-muted hover:text-nje-border',
              'disabled:cursor-not-allowed disabled:opacity-45 motion-safe:active:translate-y-px',
            )}
            role="radio"
            aria-checked={active}
          >
            {sendModeLabel(mode)}
          </motion.button>
        )
      })}
    </div>
  )
}
