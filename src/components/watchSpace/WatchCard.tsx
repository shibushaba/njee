import { useState } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, Trash2 } from 'lucide-react'
import type { WatchItemRow, WatchStatus } from '../../types/watchItem'
import { extractYoutubeVideoId, youtubeThumbUrl } from '../../utils/youtubeWatch'
import { WATCH_CONTEXT_WHISPER } from '../../utils/watchSpaceContext'
import { cn } from '../../lib/cn'
import { WatchStatusBadge } from './WatchStatusBadge'

type WatchCardProps = {
  item: WatchItemRow
  currentUserId: string | null
  peerUsername: string | null
  onSetStatus: (id: string, status: WatchStatus) => Promise<{ error: string | null }>
  onDelete: (id: string) => Promise<{ error: string | null }>
  className?: string
}

const ORDER: WatchStatus[] = ['watch_later', 'watching', 'favorite']

export function WatchCard({ item, currentUserId, peerUsername, onSetStatus, onDelete, className }: WatchCardProps) {
  const [busy, setBusy] = useState(false)
  const fromYou = item.added_by === currentUserId
  const who = fromYou ? 'You' : peerUsername?.trim() || 'Them'
  const yt = item.source_type === 'youtube' ? extractYoutubeVideoId(item.url) : null
  const thumb = yt ? youtubeThumbUrl(yt, 'mq') : null
  const whisper = item.context_label ? WATCH_CONTEXT_WHISPER[item.context_label] : null
  const href = item.url.trim().length > 0 ? item.url : undefined

  const cycle = async () => {
    const i = ORDER.indexOf(item.status)
    const next = ORDER[(i + 1) % ORDER.length]
    setBusy(true)
    await onSetStatus(item.id, next)
    setBusy(false)
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'flex flex-col gap-2 border-[2px] border-nje-border bg-nje-surface p-2.5 shadow-[var(--shadow-nje-flat-sm)] sm:p-3',
        className,
      )}
    >
      <div className="flex gap-2.5">
        <div className="relative h-16 w-28 shrink-0 overflow-hidden border-[2px] border-nje-border bg-nje-bg">
          {thumb ? (
            <img src={thumb} alt="" className="size-full object-cover" loading="lazy" decoding="async" />
          ) : (
            <div className="flex size-full items-center justify-center text-[10px] font-bold uppercase tracking-wide text-nje-whisper">
              {item.source_type === 'title' ? 'Title' : 'Link'}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1">
            <p className="line-clamp-2 text-sm font-semibold leading-snug text-nje-border">{item.title}</p>
            <WatchStatusBadge status={item.status} className="shrink-0" />
          </div>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-nje-muted">{who} · shelf</p>
        </div>
      </div>

      {item.notes?.trim() ? (
        <p className="border-l-[3px] border-nje-mint pl-2 text-xs italic leading-relaxed text-nje-muted">{item.notes.trim()}</p>
      ) : null}

      {whisper ? <p className="text-[10px] font-semibold text-nje-whisper">{whisper}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 border-[2px] border-nje-border bg-nje-mint px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-nje-border shadow-[0_2px_0_0_rgba(90,46,30,0.08)]"
          >
            Open
            <ExternalLink className="size-3" strokeWidth={2.25} aria-hidden />
          </a>
        ) : null}
        <button
          type="button"
          disabled={busy}
          onClick={() => void cycle()}
          className="border-[2px] border-nje-border bg-nje-bg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-nje-border shadow-[0_2px_0_0_rgba(90,46,30,0.08)] disabled:opacity-50"
        >
          Gentle status
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            await onDelete(item.id)
            setBusy(false)
          }}
          className="ml-auto flex size-9 items-center justify-center border-[2px] border-nje-border bg-nje-bg text-nje-border shadow-[0_2px_0_0_rgba(90,46,30,0.08)] disabled:opacity-50"
          aria-label="Remove from shelf"
        >
          <Trash2 className="size-4" strokeWidth={2.25} />
        </button>
      </div>
    </motion.article>
  )
}
