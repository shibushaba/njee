import { createPortal } from 'react-dom'
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CornerUpLeft, Pin, Trash2 } from 'lucide-react'

type MessageActionSheetProps = {
  open: boolean
  isOwn: boolean
  onClose: () => void
  onReply: () => void
  onDelete: () => void | Promise<void>
  /** Long-press / menu: save to shared pinned moments (chat + memories). */
  showPin?: boolean
  isPinned?: boolean
  onPin?: () => void | Promise<void>
}

export function MessageActionSheet({
  open,
  isOwn,
  onClose,
  onReply,
  onDelete,
  showPin = false,
  isPinned = false,
  onPin,
}: MessageActionSheetProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const node =
    typeof document !== 'undefined' ? (
      <AnimatePresence>
        {open ? (
          <motion.div
            key="msg-actions"
            className="fixed inset-0 z-[160] flex flex-col justify-end bg-nje-border/35 backdrop-blur-[1px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            role="presentation"
            onClick={(e) => {
              if (e.target === e.currentTarget) onClose()
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Message actions"
              initial={{ y: 24, opacity: 0.9 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 16, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="mx-2 mb-[max(0.5rem,env(safe-area-inset-bottom))] overflow-hidden rounded-sm border-[2px] border-nje-border bg-nje-surface shadow-[0_4px_0_0_rgba(90,46,30,0.08)] sm:mx-auto sm:mb-4 sm:max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => {
                  onReply()
                }}
                className="flex w-full items-center gap-3 border-b-[2px] border-nje-border px-4 py-3.5 text-left text-sm font-semibold text-nje-border transition-colors hover:bg-nje-bg/80"
              >
                <CornerUpLeft className="size-4 shrink-0" strokeWidth={2.25} aria-hidden />
                Reply
              </button>
              {showPin ? (
                isPinned ? (
                  <div className="border-b-[2px] border-nje-border px-4 py-3 text-xs leading-relaxed text-nje-muted">
                    Already resting on your shared shelf.
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      void onPin?.()
                    }}
                    className="flex w-full items-center gap-3 border-b-[2px] border-nje-border px-4 py-3.5 text-left text-sm font-semibold text-nje-border transition-colors hover:bg-nje-bg/80"
                  >
                    <Pin className="size-4 shrink-0" strokeWidth={2.25} aria-hidden />
                    Pin to moments
                  </button>
                )
              ) : null}
              {isOwn ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!window.confirm('Delete this message for everyone?')) return
                    void onDelete()
                  }}
                  className="flex w-full items-center gap-3 border-b-[2px] border-nje-border px-4 py-3.5 text-left text-sm font-semibold text-nje-border transition-colors hover:bg-nje-bg/80"
                >
                  <Trash2 className="size-4 shrink-0" strokeWidth={2.25} aria-hidden />
                  Delete for everyone
                </button>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className="w-full border-t-[2px] border-nje-border py-3 text-center text-xs font-bold uppercase tracking-[0.14em] text-nje-muted transition-colors hover:bg-nje-bg/60"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    ) : null

  return typeof document !== 'undefined' ? createPortal(node, document.body) : null
}
