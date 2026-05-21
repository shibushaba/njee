import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff } from 'lucide-react'
import { cn } from '../../lib/cn'

type OfflineIndicatorProps = {
  visible: boolean
  className?: string
}

export function OfflineIndicator({ visible, className }: OfflineIndicatorProps) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="offline"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22 }}
          className={cn(
            'pointer-events-none fixed left-0 right-0 top-0 z-[125] flex justify-center px-gutter pt-[max(0.35rem,env(safe-area-inset-top))]',
            className,
          )}
        >
          <div className="flex items-center gap-2 border-[2px] border-nje-border bg-nje-pink/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-nje-border shadow-[0_2px_0_0_rgba(90,46,30,0.08)]">
            <WifiOff className="size-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
            You are offline — nje will reconnect gently.
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
