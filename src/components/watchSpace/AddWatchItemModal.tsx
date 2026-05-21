import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { WatchSourceType, WatchStatus } from '../../types/watchItem'
import { inferWatchSourceType } from '../../utils/youtubeWatch'
import { cn } from '../../lib/cn'

type AddWatchItemModalProps = {
  open: boolean
  onClose: () => void
  busy: boolean
  errorText: string | null
  onSubmit: (payload: {
    title: string
    url: string
    notes: string | null
    status: WatchStatus
    sourceType: WatchSourceType
  }) => Promise<void>
}

export function AddWatchItemModal({ open, onClose, busy, errorText, onSubmit }: AddWatchItemModalProps) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<WatchStatus>('watch_later')

  useEffect(() => {
    if (!open) return
    setTitle('')
    setUrl('')
    setNotes('')
    setStatus('watch_later')
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
          key="add-watch"
          className="fixed inset-0 z-[170] flex flex-col justify-end bg-nje-border/35 backdrop-blur-[1px]"
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
            aria-label="Add to shared watch shelf"
            initial={{ y: 28, opacity: 0.92 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="mx-2 mb-[max(0.5rem,env(safe-area-inset-bottom))] max-h-[min(88dvh,640px)] overflow-y-auto rounded-sm border-[2px] border-nje-border bg-nje-surface shadow-[0_4px_0_0_rgba(90,46,30,0.08)] sm:mx-auto sm:mb-4 sm:max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b-[2px] border-nje-border px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-nje-muted">Shared shelf</p>
              <p className="mt-1 text-sm font-semibold text-nje-border">Save something to watch together</p>
              <p className="mt-1 text-xs leading-relaxed text-nje-muted">
                Paste a YouTube link, a quiet streaming URL, or only a title — this is a cozy list, not a player.
              </p>
            </div>

            <form
              className="space-y-3 px-4 py-4"
              onSubmit={async (e) => {
                e.preventDefault()
                const titleT = title.trim()
                if (!titleT) return
                const urlT = url.trim()
                const sourceType = inferWatchSourceType(urlT, urlT.length === 0)
                await onSubmit({
                  title: titleT,
                  url: urlT,
                  notes: notes.trim() ? notes.trim() : null,
                  status,
                  sourceType,
                })
              }}
            >
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-nje-muted">Title</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={300}
                  required
                  placeholder="Film name or how you remember it"
                  className="mt-1.5 w-full border-[2px] border-nje-border bg-nje-bg px-3 py-2 text-sm text-nje-border"
                />
              </label>

              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-nje-muted">Link (optional)</span>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  maxLength={2000}
                  placeholder="https://…"
                  className="mt-1.5 w-full border-[2px] border-nje-border bg-nje-bg px-3 py-2 text-sm text-nje-border"
                />
              </label>

              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-nje-muted">Soft note</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="Why it matters, or when to press play…"
                  className="mt-1.5 w-full resize-none border-[2px] border-nje-border bg-nje-bg px-3 py-2 text-sm text-nje-border"
                />
              </label>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-nje-muted">Starting mood</span>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {(['watch_later', 'watching', 'favorite'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={cn(
                        'border-[2px] border-nje-border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide shadow-[0_2px_0_0_rgba(90,46,30,0.08)]',
                        status === s ? 'bg-nje-yellow text-nje-border' : 'bg-nje-bg text-nje-muted hover:text-nje-border',
                      )}
                    >
                      {s === 'watch_later' ? 'Later' : s === 'watching' ? 'Watching' : 'Favorite'}
                    </button>
                  ))}
                </div>
              </div>

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
                  className="flex-1 border-[2px] border-nje-border bg-nje-bg py-2.5 text-xs font-bold uppercase tracking-wide text-nje-border shadow-[0_2px_0_0_rgba(90,46,30,0.08)] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="flex-1 border-[2px] border-nje-border bg-nje-mint py-2.5 text-xs font-bold uppercase tracking-wide text-nje-border shadow-[0_2px_0_0_rgba(90,46,30,0.08)] disabled:opacity-50"
                >
                  {busy ? 'Saving…' : 'Place on shelf'}
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
