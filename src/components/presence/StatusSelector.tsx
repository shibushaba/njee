import { useEffect, useId, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/cn'
import type { PresenceStatusId } from '../../types/presenceStatus'
import { MANUAL_PRESENCE_PICK_IDS } from '../../types/presenceStatus'
import { PRESENCE_LABEL, PRESENCE_WHISPER, presenceShowsAmbient } from '../../utils/presenceStatusMeta'

type StatusSelectorProps = {
  open: boolean
  onClose: () => void
  value: PresenceStatusId
  onSelect: (id: PresenceStatusId) => void
  busy?: boolean
}

export function StatusSelector({ open, onClose, value, onSelect, busy }: StatusSelectorProps) {
  const panelId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            aria-label="Close status sheet"
            className="absolute inset-0 bg-nje-border/15 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={panelId}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 36 }}
            className={cn(
              'relative z-[1] w-full max-w-md overflow-hidden rounded-sm border-[2px] border-nje-border bg-nje-surface shadow-[0_6px_0_0_rgba(90,46,30,0.06)]',
              'max-h-[min(85dvh,420px)]',
            )}
          >
            <div className="flex items-center justify-between border-b-[2px] border-nje-border px-3 py-2.5 sm:px-3.5">
              <p id={panelId} className="text-xs font-bold uppercase tracking-[0.14em] text-nje-border">
                Status
              </p>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className="border-[2px] border-nje-border bg-nje-bg px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-nje-muted shadow-[0_2px_0_0_rgba(90,46,30,0.05)]"
              >
                Close
              </button>
            </div>

            <div className="overflow-y-auto overscroll-contain px-2 py-2 sm:px-2.5">
              <p className="mb-2 px-0.5 text-[11px] leading-snug text-nje-muted">
                Only when something is worth signaling. Otherwise your thread already shows you’re around.
              </p>

              {presenceShowsAmbient(value) ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    onSelect('active_now')
                    onClose()
                  }}
                  className={cn(
                    'mb-2 w-full rounded-sm border-[2px] border-nje-border bg-nje-bg/50 px-2.5 py-2 text-left text-xs font-bold text-nje-border shadow-[0_2px_0_0_rgba(90,46,30,0.04)] transition hover:bg-nje-bg/75',
                    busy && 'pointer-events-none opacity-60',
                  )}
                >
                  Clear — usual
                </button>
              ) : (
                <p className="mb-2 px-0.5 text-[11px] leading-snug text-nje-muted">
                  Usual — the bar already shows you’re around.
                </p>
              )}

              <ul className="flex flex-col gap-1">
                {MANUAL_PRESENCE_PICK_IDS.map((id) => {
                  const selected = id === value
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          onSelect(id)
                          onClose()
                        }}
                        className={cn(
                          'flex w-full flex-col items-start gap-0.5 rounded-sm border-[2px] px-2.5 py-2 text-left transition-[background,transform,opacity] duration-200 ease-out',
                          selected
                            ? 'border-nje-border bg-nje-mint/80 shadow-[0_2px_0_0_rgba(90,46,30,0.05)]'
                            : 'border-transparent bg-nje-bg/40 hover:border-nje-border/40 hover:bg-nje-bg/70',
                          busy && 'pointer-events-none opacity-60',
                        )}
                      >
                        <span className="text-xs font-bold text-nje-border">{PRESENCE_LABEL[id]}</span>
                        <span className="text-[11px] leading-snug text-nje-muted">{PRESENCE_WHISPER[id]}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
