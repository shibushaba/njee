import { AnimatePresence, motion } from 'framer-motion'
import { Bell, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ToastItem } from '../../hooks/useToastStack'
import { notificationKindLabel } from '../../utils/notificationDisplay'
import { cn } from '../../lib/cn'

type NjeToastStackProps = {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
  className?: string
}

export function NjeToastStack({ toasts, onDismiss, className }: NjeToastStackProps) {
  const navigate = useNavigate()

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 top-0 z-[150] flex flex-col items-center gap-2 px-gutter pt-[max(0.5rem,env(safe-area-inset-top))]',
        className,
      )}
      aria-live="polite"
      aria-relevant="additions"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            role="status"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto w-[min(100%,22rem)]"
          >
            <div className="flex items-start gap-2 border-[2px] border-nje-border bg-nje-surface/98 px-3 py-2.5 shadow-[var(--shadow-nje-flat-sm)] backdrop-blur-[2px]">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center border-[2px] border-nje-border bg-nje-mint">
                <Bell className="size-4 text-nje-border" strokeWidth={2.25} aria-hidden />
              </div>
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => {
                  onDismiss(toast.id)
                  navigate(toast.url)
                }}
              >
                <p className="flex items-center gap-2">
                  <span className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-nje-whisper">
                    {notificationKindLabel(toast.kind)}
                  </span>
                </p>
                <p className="mt-0.5 text-sm font-bold leading-snug text-nje-border">{toast.title}</p>
                {toast.body ? (
                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-nje-muted">{toast.body}</p>
                ) : null}
              </button>
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className="flex size-8 shrink-0 items-center justify-center border-[2px] border-nje-border bg-nje-bg text-nje-border"
                aria-label="Dismiss notification"
              >
                <X className="size-4" strokeWidth={2.25} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
