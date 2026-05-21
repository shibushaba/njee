import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { TimeCapsuleType } from '../../types/timeCapsule'
import { cn } from '../../lib/cn'

export type CapsuleComposerPayload = {
  capsuleTitle: string | null
  content: string
  capsuleType: TimeCapsuleType
  mediaUrl: string | null
  mediaType: 'image' | 'video' | null
  unlockAtIso: string
}

function buildDefaultUnlockLocal() {
  const d = new Date(Date.now() + 24 * 3600000)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

function localDatetimeToIso(local: string) {
  const d = new Date(local)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

type CapsuleComposerProps = {
  open: boolean
  onClose: () => void
  busy: boolean
  errorText: string | null
  onSubmit: (payload: CapsuleComposerPayload) => Promise<void>
}

export function CapsuleComposer({ open, onClose, busy, errorText, onSubmit }: CapsuleComposerProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [mediaKind, setMediaKind] = useState<'none' | 'image' | 'video' | 'voice'>('none')
  const [unlockLocal, setUnlockLocal] = useState(buildDefaultUnlockLocal)

  useEffect(() => {
    if (!open) return
    setTitle('')
    setContent('')
    setMediaUrl('')
    setMediaKind('none')
    setUnlockLocal(buildDefaultUnlockLocal())
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
          key="capsule-composer"
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
            aria-label="Seal a time capsule"
            initial={{ y: 28, opacity: 0.92 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="mx-2 mb-[max(0.5rem,env(safe-area-inset-bottom))] max-h-[min(92dvh,720px)] overflow-y-auto rounded-sm border-[2px] border-nje-border bg-nje-surface shadow-[0_4px_0_0_rgba(90,46,30,0.08)] sm:mx-auto sm:mb-4 sm:max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b-[2px] border-nje-border px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-nje-muted">Time capsule</p>
              <p className="mt-1 text-sm font-semibold leading-snug text-nje-border">Leave something for later</p>
              <p className="mt-1 text-xs leading-relaxed text-nje-muted">
                Pick a quiet hour. Until then, only a gentle preview shows — no peeking inside.
              </p>
            </div>

            <form
              className="space-y-3 px-4 py-4"
              onSubmit={async (e) => {
                e.preventDefault()
                const iso = localDatetimeToIso(unlockLocal)
                if (!iso) return
                const minAhead = Date.now() + 60_000
                if (new Date(iso).getTime() < minAhead) return

                const url = mediaUrl.trim()
                const hasMedia = mediaKind !== 'none' && url.length > 0
                const body = content.trim()

                let capsuleType: TimeCapsuleType = 'text'
                let mediaType: 'image' | 'video' | null = null
                let mediaPayload: string | null = null

                if (mediaKind === 'image') {
                  capsuleType = 'image'
                  mediaType = 'image'
                  mediaPayload = url || null
                } else if (mediaKind === 'video') {
                  capsuleType = 'video'
                  mediaType = 'video'
                  mediaPayload = url || null
                } else if (mediaKind === 'voice') {
                  capsuleType = 'voice'
                  mediaType = null
                  mediaPayload = url || null
                }

                if (!body && !hasMedia) return

                await onSubmit({
                  capsuleTitle: title.trim() || null,
                  content: body,
                  capsuleType,
                  mediaUrl: mediaPayload,
                  mediaType,
                  unlockAtIso: iso,
                })
              }}
            >
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-nje-muted">Soft title (optional)</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                  placeholder="For example: when autumn returns"
                  className="mt-1.5 w-full border-[2px] border-nje-border bg-nje-bg px-3 py-2 text-sm text-nje-border shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] placeholder:text-nje-whisper"
                />
              </label>

              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-nje-muted">Message (optional if you add media)</span>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  placeholder="Write what you want them to feel when this opens…"
                  className="mt-1.5 w-full resize-none border-[2px] border-nje-border bg-nje-bg px-3 py-2 text-sm leading-relaxed text-nje-border shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] placeholder:text-nje-whisper"
                />
              </label>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-nje-muted">Media (optional)</span>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {(['none', 'image', 'video', 'voice'] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setMediaKind(k)}
                      className={cn(
                        'border-[2px] border-nje-border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide shadow-[0_2px_0_0_rgba(90,46,30,0.08)] transition-colors',
                        mediaKind === k ? 'bg-nje-yellow text-nje-border' : 'bg-nje-bg text-nje-muted hover:text-nje-border',
                      )}
                    >
                      {k === 'none' ? 'Text only' : k}
                    </button>
                  ))}
                </div>
                {mediaKind !== 'none' ? (
                  <input
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder={
                      mediaKind === 'voice'
                        ? 'Direct link to an audio file (https…)'
                        : 'Paste gdrive:… from chat, or a public image/video URL'
                    }
                    className="mt-2 w-full border-[2px] border-nje-border bg-nje-bg px-3 py-2 text-xs text-nje-border"
                  />
                ) : null}
              </div>

              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-nje-muted">Unlock time</span>
                <input
                  type="datetime-local"
                  value={unlockLocal}
                  onChange={(e) => setUnlockLocal(e.target.value)}
                  className="mt-1.5 w-full border-[2px] border-nje-border bg-nje-bg px-3 py-2 text-sm text-nje-border"
                />
                <p className="mt-1 text-[10px] text-nje-whisper">Must be at least one minute from now.</p>
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
                  className="flex-1 border-[2px] border-nje-border bg-nje-bg py-2.5 text-xs font-bold uppercase tracking-wide text-nje-border shadow-[0_2px_0_0_rgba(90,46,30,0.08)] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="flex-1 border-[2px] border-nje-border bg-nje-mint py-2.5 text-xs font-bold uppercase tracking-wide text-nje-border shadow-[0_2px_0_0_rgba(90,46,30,0.08)] disabled:opacity-50"
                >
                  {busy ? 'Sealing…' : 'Seal capsule'}
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
