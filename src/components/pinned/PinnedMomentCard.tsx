import { useState } from 'react'
import { motion } from 'framer-motion'
import { Image as ImageIcon, Video } from 'lucide-react'
import type { PinnedMomentRow } from '../../types/pinnedMoment'
import { formatChatTime } from '../../utils/formatChatTime'
import { PIN_CONTEXT_WHISPER } from '../../utils/pinnedMomentContext'
import { cn } from '../../lib/cn'
import { isGdriveMediaRef, parseGdriveFileId, publicDriveThumbnailUrl } from '../../utils/gdriveMediaUrl'
import { UnpinButton } from './UnpinButton'

type PinnedMomentCardProps = {
  pin: PinnedMomentRow
  currentUserId: string | null
  peerUsername: string | null
  onUnpin: (pinId: string) => Promise<{ error: string | null }>
  className?: string
}

export function PinnedMomentCard({ pin, currentUserId, peerUsername, onUnpin, className }: PinnedMomentCardProps) {
  const [busy, setBusy] = useState(false)
  const m = pin.message
  const fromYou = m.sender_id === currentUserId
  const senderLabel = fromYou ? 'You' : (peerUsername?.trim() || 'Them')
  const whisper = pin.context_label ? PIN_CONTEXT_WHISPER[pin.context_label] : null

  const isMedia = m.message_type === 'image' || m.message_type === 'video'
  const fid = m.media_url && isGdriveMediaRef(m.media_url) ? parseGdriveFileId(m.media_url) : null
  const thumb = fid ? publicDriveThumbnailUrl(fid, 'w320') : null

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'flex flex-col gap-2 border-[2px] border-nje-border bg-nje-surface p-2.5 shadow-[0_2px_0_0_rgba(90,46,30,0.06)] sm:p-3',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-nje-muted">Pinned moment</p>
          <p className="mt-0.5 truncate text-xs font-semibold text-nje-border">{senderLabel}</p>
          <time className="text-[10px] font-semibold uppercase tracking-[0.1em] text-nje-border/60" dateTime={m.created_at}>
            {formatChatTime(m.created_at)}
          </time>
        </div>
        <UnpinButton
          busy={busy}
          onClick={async () => {
            setBusy(true)
            const res = await onUnpin(pin.id)
            setBusy(false)
            if (res.error) window.alert(res.error)
          }}
        />
      </div>

      {whisper ? <p className="text-[11px] leading-snug text-nje-muted">{whisper}</p> : null}

      {isMedia && thumb ? (
        <div className="relative overflow-hidden border-[2px] border-nje-border bg-nje-bg">
          <div className="flex max-h-36 items-center justify-center">
            <img src={thumb} alt="" className="max-h-36 w-full object-cover" loading="lazy" decoding="async" />
          </div>
          <span className="absolute left-1.5 top-1.5 flex size-7 items-center justify-center border-[2px] border-nje-border bg-nje-surface/90 text-nje-border shadow-[0_1px_0_0_rgba(90,46,30,0.06)]">
            {m.message_type === 'video' ? <Video className="size-3.5" strokeWidth={2.25} /> : <ImageIcon className="size-3.5" strokeWidth={2.25} />}
          </span>
        </div>
      ) : null}

      {m.message_type === 'text' || !thumb ? (
        <p className="line-clamp-3 text-sm leading-snug text-nje-border">
          {m.content.trim() || (isMedia ? 'Media in this thread' : '…')}
        </p>
      ) : m.content.trim() ? (
        <p className="line-clamp-2 border-t border-nje-border/25 pt-2 text-xs leading-snug text-nje-muted">{m.content}</p>
      ) : null}
    </motion.article>
  )
}
