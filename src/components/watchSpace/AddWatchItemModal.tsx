import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { WatchSourceType } from '../../types/watchItem'
import { inferWatchSourceType } from '../../utils/youtubeWatch'
import { cn } from '../../lib/cn'

type AddWatchItemModalProps = {
  open: boolean
  onClose: () => void
  busy: boolean
  errorText: string | null
  peerUsername: string | null
  onSubmit: (payload: {
    title: string
    url: string
    notes: string | null
    sourceType: WatchSourceType
    suggestStars: number
    priority: number
  }) => Promise<void>
}

export function AddWatchItemModal({
  open,
  onClose,
  busy,
  errorText,
  peerUsername,
  onSubmit,
}: AddWatchItemModalProps) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [suggestStars, setSuggestStars] = useState(4)
  const [priority, setPriority] = useState(2)

  useEffect(() => {
    if (!open) return
    setTitle('')
    setUrl('')
    setNotes('')
    setSuggestStars(4)
    setPriority(2)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const peer = peerUsername?.trim() || 'them'

  const sheet = (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="add-suggestion"
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
            aria-label="Suggest a film"
            initial={{ y: 28, opacity: 0.92 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="mx-2 mb-[max(0.5rem,env(safe-area-inset-bottom))] max-h-[min(88dvh,680px)] overflow-y-auto rounded-sm border-[2px] border-nje-border bg-nje-surface shadow-[0_4px_0_0_rgba(90,46,30,0.08)] sm:mx-auto sm:mb-4 sm:max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b-[2px] border-nje-border px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-nje-muted">Suggestion portal</p>
              <p className="mt-1 text-sm font-semibold text-nje-border">Something for {peer}</p>
              <p className="mt-1 text-xs leading-relaxed text-nje-muted">
                A tiny letter with a title, optional link, how strongly you feel (stars), and how soon you hope they see
                it (priority). No streaming here — just the whisper of what to press play on later.
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
                  sourceType,
                  suggestStars,
                  priority,
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
                  placeholder="Film name or gentle nickname for it"
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
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-nje-muted">Small note (optional)</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  maxLength={2000}
                  placeholder="Why you thought of them…"
                  className="mt-1.5 w-full resize-none border-[2px] border-nje-border bg-nje-bg px-3 py-2 text-sm text-nje-border"
                />
              </label>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-nje-muted">Stars you give (1–5)</span>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setSuggestStars(n)}
                      className={cn(
                        'size-10 border-[2px] border-nje-border text-sm font-bold shadow-[0_2px_0_0_rgba(90,46,30,0.08)]',
                        suggestStars === n ? 'bg-nje-yellow text-nje-border' : 'bg-nje-bg text-nje-muted',
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-nje-muted">Priority</span>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {[
                    { v: 1, label: 'Soon' },
                    { v: 2, label: 'When you can' },
                    { v: 3, label: 'Softly' },
                  ].map(({ v, label }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setPriority(v)}
                      className={cn(
                        'border-[2px] border-nje-border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide shadow-[0_2px_0_0_rgba(90,46,30,0.08)]',
                        priority === v ? 'bg-nje-pink text-nje-border' : 'bg-nje-bg text-nje-muted hover:text-nje-border',
                      )}
                    >
                      {label}
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
                  {busy ? 'Sending…' : 'Send suggestion'}
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
