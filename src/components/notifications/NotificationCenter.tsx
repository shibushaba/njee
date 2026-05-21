import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import type { NotificationRow } from '../../types/notification'
import { cn } from '../../lib/cn'
import { NotificationCard } from './NotificationCard'

type NotificationCenterProps = {
  open: boolean
  onClose: () => void
  items: NotificationRow[]
  loading: boolean
  onMarkAllRead: () => Promise<void>
  onMarkRead: (id: string) => Promise<void>
  className?: string
}

export function NotificationCenter({
  open,
  onClose,
  items,
  loading,
  onMarkAllRead,
  onMarkRead,
  className,
}: NotificationCenterProps) {
  const reduceMotion = useReducedMotion()
  const navigate = useNavigate()

  const handleOpen = async (row: NotificationRow) => {
    await onMarkRead(row.id)
    if (row.kind === 'message' || row.kind === 'media') {
      navigate('/chat')
    } else if (row.kind === 'streak') {
      navigate('/ritual')
    } else if (row.kind === 'pinned_moment') {
      navigate('/moments')
    } else if (row.kind === 'watch_shelf') {
      navigate('/lounge/watch')
    } else if (row.kind === 'time_capsule') {
      navigate('/lounge/capsules')
    }
    onClose()
  }

  const handleMarkAll = async () => {
    await onMarkAllRead()
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="nje-notify-center"
          className={cn('fixed inset-0 z-[180] flex justify-end p-2 sm:p-3', className)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.12 : 0.2 }}
        >
          <motion.button
            type="button"
            aria-label="Close notifications"
            className="absolute inset-0 bg-nje-border/20 backdrop-blur-[1px]"
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal
            aria-labelledby="nje-notify-title"
            className="relative z-10 flex max-h-[min(85dvh,32rem)] w-full max-w-sm flex-col border-[3px] border-nje-border bg-nje-surface shadow-[var(--shadow-nje-flat)]"
            initial={reduceMotion ? false : { x: 24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { x: 16, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.14 : 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className="shrink-0 border-b-[2px] border-nje-border px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <h2 id="nje-notify-title" className="text-sm font-bold tracking-tight text-nje-border">
                  Gentle pings
                </h2>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => void handleMarkAll()}
                    className="border-[2px] border-transparent px-2 py-1 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-nje-muted underline decoration-nje-border/30 decoration-1 underline-offset-2 hover:text-nje-border"
                  >
                    Mark all read
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="border-[2px] border-nje-border bg-nje-bg px-2 py-1 text-xs font-bold text-nje-border shadow-[0_2px_0_0_rgba(90,46,30,0.06)]"
                  >
                    Close
                  </button>
                </div>
              </div>
              <p className="mt-1 text-[0.65rem] leading-relaxed text-nje-muted">Only what matters between you two.</p>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {loading ? (
                <div className="space-y-2 p-3" aria-busy>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 animate-pulse border-[2px] border-nje-border/25 bg-nje-bg/70" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-nje-muted">Nothing here yet — quiet is okay too.</p>
              ) : (
                items.map((row) => <NotificationCard key={row.id} row={row} onOpen={(r) => void handleOpen(r)} />)
              )}
            </div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
