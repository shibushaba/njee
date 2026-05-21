import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '../../lib/cn'

type MarkWatchedModalProps = {
  open: boolean
  title: string
  busy: boolean
  errorText: string | null
  onClose: () => void
  onSubmit: (abi: string, starsWatch: number) => Promise<void>
}

export function MarkWatchedModal({ open, title, busy, errorText, onClose, onSubmit }: MarkWatchedModalProps) {
  const [abi, setAbi] = useState('')
  const [stars, setStars] = useState(5)

  useEffect(() => {
    if (!open) return
    setAbi('')
    setStars(5)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const sheet = (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="mark-watched"
          className="fixed inset-0 z-[175] flex flex-col justify-end bg-nje-border/35 backdrop-blur-[1px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Mark as watched"
            initial={{ y: 28, opacity: 0.92 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="mx-2 mb-[max(0.5rem,env(safe-area-inset-bottom))] max-h-[min(88dvh,560px)] overflow-y-auto rounded-sm border-[2px] border-nje-border bg-nje-surface shadow-[0_4px_0_0_rgba(90,46,30,0.08)] sm:mx-auto sm:mb-4 sm:max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b-[2px] border-nje-border px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-nje-muted">Watched</p>
              <p className="mt-1 line-clamp-2 text-sm font-semibold text-nje-border">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-nje-muted">
                Leave a quiet <span className="font-bold">abi</span> and how many stars this one earned for you.
              </p>
            </div>
            <form
              className="space-y-3 px-4 py-4"
              onSubmit={async (e) => {
                e.preventDefault()
                await onSubmit(abi, stars)
              }}
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-nje-muted">Stars after watching (1–5)</span>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setStars(n)}
                      className={cn(
                        'size-10 border-[2px] border-nje-border text-sm font-bold shadow-[0_2px_0_0_rgba(90,46,30,0.08)]',
                        stars === n ? 'bg-nje-yellow text-nje-border' : 'bg-nje-bg text-nje-muted',
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-nje-muted">Abi</span>
                <textarea
                  value={abi}
                  onChange={(e) => setAbi(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  required
                  placeholder="A few honest lines about how it felt…"
                  className="mt-1.5 w-full resize-none border-[2px] border-nje-border bg-nje-bg px-3 py-2 text-sm text-nje-border"
                />
              </label>
              {errorText ? (
                <p className="rounded-sm border-[2px] border-nje-border bg-nje-pink/50 px-2 py-1.5 text-xs font-semibold text-nje-border">
                  {errorText}
                </p>
              ) : null}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={busy}
                  className="flex-1 border-[2px] border-nje-border bg-nje-bg py-2.5 text-xs font-bold uppercase tracking-wide text-nje-border disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="flex-1 border-[2px] border-nje-border bg-nje-mint py-2.5 text-xs font-bold uppercase tracking-wide text-nje-border disabled:opacity-50"
                >
                  {busy ? 'Saving…' : 'Save watched'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )

  if (typeof document === 'undefined') return null
  return createPortal(sheet, document.body)
}
