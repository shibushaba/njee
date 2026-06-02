import { createPortal } from 'react-dom'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { WheelEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { purgeLockedMediaAfterLock, recordMediaViewWithLimit } from '../../services/media.service'
import type { MessageRow } from '../../types/message'
import type { FullscreenMediaPayload } from '../../types/mediaViewer'
import { VideoPlayer } from './VideoPlayer'

export type { FullscreenMediaPayload } from '../../types/mediaViewer'

type FullscreenMediaViewerProps = {
  open: boolean
  payload: FullscreenMediaPayload | null
  onClose: () => void
  onMediaViewRecorded?: (messageId: string, patch: Partial<MessageRow>) => void
  /** e.g. refetch messages when RPC fails so UI matches server */
  onRecordMediaViewFailure?: () => void
}

export function FullscreenMediaViewer({
  open,
  payload,
  onClose,
  onMediaViewRecorded,
  onRecordMediaViewFailure,
}: FullscreenMediaViewerProps) {
  const recordedForOpenRef = useRef<string | null>(null)
  const openRef = useRef(open)
  const payloadMidRef = useRef<string | null>(null)
  const onCloseRef = useRef(onClose)
  const onMediaViewRecordedRef = useRef(onMediaViewRecorded)
  const onRecordMediaViewFailureRef = useRef(onRecordMediaViewFailure)
  const pan = useRef({ active: false, sx: 0, sy: 0, stx: 0, sty: 0 })

  const [scale, setScale] = useState(1)
  const [tx, setTx] = useState(0)
  const [ty, setTy] = useState(0)

  openRef.current = open
  payloadMidRef.current = payload?.messageId ?? null
  onCloseRef.current = onClose
  onMediaViewRecordedRef.current = onMediaViewRecorded
  onRecordMediaViewFailureRef.current = onRecordMediaViewFailure

  const messageId = payload?.messageId

  useEffect(() => {
    if (!open) {
      recordedForOpenRef.current = null
      return
    }
    if (!messageId) return
    if (recordedForOpenRef.current === messageId) return
    recordedForOpenRef.current = messageId

    const mid = messageId
    const mediaRef = payload?.storagePath ?? payload?.driveFileId ?? null
    const viewLimit = payload?.viewLimit ?? null
    const currentViews = payload?.currentViews ?? 0
    const limited = viewLimit != null && viewLimit > 0

    void recordMediaViewWithLimit(mid, { viewLimit, currentViews }).then(async (r) => {
      if (r.needsRefetch) {
        onRecordMediaViewFailureRef.current?.()
        if (limited && openRef.current && payloadMidRef.current === mid) {
          onCloseRef.current()
        }
        return
      }

      if (!r.unlimited && !r.ok && !r.locked) {
        onRecordMediaViewFailureRef.current?.()
      }

      const shouldPatch = !r.unlimited && (r.ok || r.locked)
      if (shouldPatch) {
        const patch: Partial<MessageRow> = {}
        if (typeof r.current_views === 'number') patch.current_views = r.current_views
        if (r.locked) patch.is_locked = true

        const exhausted =
          limited &&
          (r.locked ||
            (typeof r.current_views === 'number' && r.current_views >= viewLimit) ||
            (typeof r.current_views !== 'number' && currentViews + 1 >= viewLimit))

        if (exhausted && mediaRef) {
          const purged = await purgeLockedMediaAfterLock(
            payload?.storagePath ?? (payload?.driveFileId ? `gdrive:${payload.driveFileId}` : ''),
            mid,
          )
          if (purged.cleared) {
            patch.media_url = null
            patch.media_type = null
          }
        }

        if (Object.keys(patch).length > 0) {
          onMediaViewRecordedRef.current?.(mid, patch)
        }
      }

      if (!r.ok && r.locked && !r.unlimited && openRef.current && payloadMidRef.current === mid) {
        onCloseRef.current()
      }
    })
  }, [open, messageId, payload?.storagePath, payload?.driveFileId, payload?.viewLimit, payload?.currentViews])

  useEffect(() => {
    if (!open) {
      setScale(1)
      setTx(0)
      setTy(0)
      return
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const onWheel = useCallback(
    (e: WheelEvent<HTMLDivElement>) => {
      if (payload?.kind !== 'image') return
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setScale((s) => {
        const n = Math.min(4, Math.max(1, s + delta))
        if (n <= 1) {
          setTx(0)
          setTy(0)
        }
        return n
      })
    },
    [payload?.kind],
  )

  const node =
    typeof document !== 'undefined' ? (
      <AnimatePresence>
        {open && payload ? (
          <motion.div
            key="fs"
            className="fixed inset-0 z-[200] flex flex-col bg-nje-border/90 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-label="Media viewer"
          >
            <div className="flex shrink-0 items-center justify-end px-2 py-2 sm:px-3">
              <button
                type="button"
                onClick={onClose}
                className="flex size-10 items-center justify-center border-[2px] border-nje-border bg-nje-surface text-nje-border shadow-[0_2px_0_0_rgba(90,46,30,0.06)] transition-transform duration-150 motion-safe:active:translate-y-px"
                aria-label="Close"
              >
                <X className="size-[1.15rem]" strokeWidth={2.5} aria-hidden />
              </button>
            </div>

            <div
              className="relative min-h-0 flex-1 touch-none px-2 pb-3 sm:px-3"
              onClick={(e) => {
                if (e.target === e.currentTarget) onClose()
              }}
            >
              {payload.kind === 'image' ? (
                <div
                  className="relative flex h-full max-h-[calc(100dvh-4.75rem)] w-full items-center justify-center overflow-hidden"
                  onWheel={onWheel}
                  onPointerDown={(e) => {
                    if (scale <= 1) return
                    pan.current = {
                      active: true,
                      sx: e.clientX,
                      sy: e.clientY,
                      stx: tx,
                      sty: ty,
                    }
                    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
                  }}
                  onPointerMove={(e) => {
                    if (!pan.current.active) return
                    setTx(pan.current.stx + e.clientX - pan.current.sx)
                    setTy(pan.current.sty + e.clientY - pan.current.sy)
                  }}
                  onPointerUp={(e) => {
                    pan.current.active = false
                    try {
                      ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
                    } catch {
                      /* noop */
                    }
                  }}
                  onPointerCancel={() => {
                    pan.current.active = false
                  }}
                >
                  <div
                    className="max-h-full max-w-full will-change-transform"
                    style={{
                      transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
                    }}
                  >
                    <img
                      src={payload.url}
                      alt=""
                      draggable={false}
                      className="max-h-[calc(100dvh-7rem)] max-w-full border-[2px] border-nje-border object-contain shadow-[0_3px_0_0_rgba(90,46,30,0.08)]"
                    />
                  </div>
                </div>
              ) : payload.kind === 'voice' ? (
                <div className="flex h-full max-h-[calc(100dvh-4.75rem)] w-full items-center justify-center px-4">
                  <audio controls autoPlay src={payload.url} className="w-full max-w-md" preload="auto" />
                </div>
              ) : payload.driveVideoEmbedUrl ? (
                <div className="flex h-full max-h-[calc(100dvh-4.75rem)] w-full items-center justify-center px-1">
                  <iframe
                    title="Memory video"
                    src={payload.driveVideoEmbedUrl}
                    allow="fullscreen; autoplay"
                    className="h-full w-full max-h-[calc(100dvh-6rem)] border-[2px] border-nje-border bg-nje-bg"
                  />
                </div>
              ) : (
                <div className="flex h-full max-h-[calc(100dvh-4.75rem)] w-full items-center justify-center">
                  <VideoPlayer src={payload.url} className="max-h-full max-w-full" />
                </div>
              )}
            </div>

            {payload.caption ? (
              <p className="shrink-0 border-t-[2px] border-nje-border/40 px-3 py-2 text-center text-xs leading-relaxed text-nje-bg">
                {payload.caption}
              </p>
            ) : null}

            {payload.kind === 'image' ? (
              <p className="shrink-0 pb-3 text-center text-[0.58rem] font-bold uppercase tracking-[0.16em] text-nje-bg/80">
                Scroll to zoom · drag when zoomed
              </p>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    ) : null

  return typeof document !== 'undefined' ? createPortal(node, document.body) : null
}
