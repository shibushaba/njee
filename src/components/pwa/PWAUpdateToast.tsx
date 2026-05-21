import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, X } from 'lucide-react'
import { cn } from '../../lib/cn'

type PWAUpdateToastProps = {
  visible: boolean
  onApply: () => void | Promise<void>
  onDismiss: () => void
  className?: string
}

export function PWAUpdateToast({ visible, onApply, onDismiss, className }: PWAUpdateToastProps) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="pwa-update"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            'pointer-events-auto fixed left-1/2 top-[max(0.5rem,env(safe-area-inset-top))] z-[140] w-[min(100%-1.5rem,22rem)] -translate-x-1/2',
            className,
          )}
        >
          <div className="flex items-center gap-2 border-[2px] border-nje-border bg-nje-yellow/95 px-3 py-2 shadow-[var(--shadow-nje-flat-sm)] backdrop-blur-[1px]">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-nje-border">Soft refresh</p>
              <p className="text-xs font-semibold leading-snug text-nje-border">A warmer build is ready — update when you have a quiet moment.</p>
            </div>
            <button
              type="button"
              onClick={() => void onApply()}
              className="flex shrink-0 items-center gap-1 border-[2px] border-nje-border bg-nje-mint px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-nje-border"
            >
              <RefreshCw className="size-3.5" strokeWidth={2.25} aria-hidden />
              Update
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="flex size-9 shrink-0 items-center justify-center border-[2px] border-nje-border bg-nje-surface text-nje-border"
              aria-label="Dismiss update notice"
            >
              <X className="size-4" strokeWidth={2.25} />
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
