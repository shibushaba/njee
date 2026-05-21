import { motion } from 'framer-motion'
import { Download, X } from 'lucide-react'
import { cn } from '../../lib/cn'

type InstallPromptProps = {
  visible: boolean
  onInstall: () => void | Promise<void>
  onDismiss: () => void
  className?: string
}

export function InstallPrompt({ visible, onInstall, onDismiss, className }: InstallPromptProps) {
  if (!visible) return null

  return (
    <motion.div
      role="region"
      aria-label="Install nje"
      initial={{ y: 28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'pointer-events-auto fixed inset-x-0 bottom-0 z-[130] flex justify-center px-3 pb-[max(5.25rem,calc(env(safe-area-inset-bottom)+4.75rem))] pt-2',
        className,
      )}
    >
      <div className="flex w-full max-w-lg items-stretch gap-2 border-[2px] border-nje-border bg-nje-surface/98 px-3 py-2.5 shadow-[var(--shadow-nje-flat-sm)] backdrop-blur-[2px] sm:max-w-md">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-nje-muted">Home screen</p>
          <p className="mt-0.5 text-xs font-semibold leading-snug text-nje-border">Keep nje one tap away — like a tiny private app.</p>
        </div>
        <button
          type="button"
          onClick={() => void onInstall()}
          className="flex shrink-0 items-center gap-1.5 border-[2px] border-nje-border bg-nje-mint px-2.5 py-2 text-[10px] font-bold uppercase tracking-wide text-nje-border shadow-[0_2px_0_0_rgba(90,46,30,0.08)]"
        >
          <Download className="size-3.5" strokeWidth={2.25} aria-hidden />
          Install
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="flex size-10 shrink-0 items-center justify-center border-[2px] border-nje-border bg-nje-bg text-nje-border"
          aria-label="Dismiss install suggestion"
        >
          <X className="size-4" strokeWidth={2.25} />
        </button>
      </div>
    </motion.div>
  )
}
