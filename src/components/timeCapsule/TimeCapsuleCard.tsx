import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import type { TimeCapsuleRow } from '../../types/timeCapsule'
import { formatChatTime } from '../../utils/formatChatTime'
import { PIN_CONTEXT_WHISPER } from '../../utils/pinnedMomentContext'
import {
  isGdriveMediaRef,
  parseGdriveFileId,
  publicDriveImageViewUrl,
  publicDriveThumbnailUrl,
  publicDriveVideoEmbedUrl,
} from '../../utils/gdriveMediaUrl'
import { cn } from '../../lib/cn'
import { LockedCapsulePreview } from './LockedCapsulePreview'
import { CapsuleUnlockAnimation } from './CapsuleUnlockAnimation'

type TimeCapsuleCardProps = {
  capsule: TimeCapsuleRow
  currentUserId: string | null
  peerUsername: string | null
  onDelete: (id: string) => Promise<{ error: string | null }>
  className?: string
}

export function TimeCapsuleCard({ capsule, currentUserId, peerUsername, onDelete, className }: TimeCapsuleCardProps) {
  const fromYou = capsule.sender_id === currentUserId
  const senderLabel = fromYou ? 'you' : peerUsername?.trim() || 'them'
  const whisper = capsule.context_label ? PIN_CONTEXT_WHISPER[capsule.context_label] : null
  const [busy, setBusy] = useState(false)
  const [burst, setBurst] = useState(false)
  const prevUnlocked = useRef(capsule.is_unlocked)

  useEffect(() => {
    if (!prevUnlocked.current && capsule.is_unlocked) {
      setBurst(true)
      const t = window.setTimeout(() => setBurst(false), 1200)
      return () => window.clearTimeout(t)
    }
    prevUnlocked.current = capsule.is_unlocked
  }, [capsule.is_unlocked])

  const fid = capsule.media_url && isGdriveMediaRef(capsule.media_url) ? parseGdriveFileId(capsule.media_url) : null
  const thumb = fid && capsule.media_type === 'image' ? publicDriveThumbnailUrl(fid, 'w480') : null
  const imgView = fid && capsule.media_type === 'image' ? publicDriveImageViewUrl(fid) : null
  const videoEmbed = fid && capsule.media_type === 'video' ? publicDriveVideoEmbedUrl(fid) : null

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative flex flex-col gap-2 overflow-hidden border-[2px] border-nje-border bg-nje-surface p-2.5 shadow-[var(--shadow-nje-flat-sm)] sm:p-3',
        className,
      )}
    >
      <CapsuleUnlockAnimation active={burst} />
      <div className="relative z-[1] flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-nje-muted">Time capsule</p>
          <time className="text-[10px] font-semibold uppercase tracking-[0.1em] text-nje-border/60" dateTime={capsule.created_at}>
            Sealed {formatChatTime(capsule.created_at)}
          </time>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            await onDelete(capsule.id)
            setBusy(false)
          }}
          className="flex size-9 shrink-0 items-center justify-center border-[2px] border-nje-border bg-nje-bg text-nje-border shadow-[0_2px_0_0_rgba(90,46,30,0.08)] transition-transform hover:bg-nje-pink/80 motion-safe:active:translate-y-px disabled:opacity-50"
          aria-label="Remove capsule"
        >
          <Trash2 className="size-4" strokeWidth={2.25} />
        </button>
      </div>

      <LockedCapsulePreview
        title={capsule.capsule_title}
        unlockAtIso={capsule.unlock_at}
        isUnlocked={capsule.is_unlocked}
        senderLabel={senderLabel}
        className="relative z-[1] rounded-sm"
      />

      {whisper ? (
        <p className="relative z-[1] text-[10px] font-semibold italic leading-relaxed text-nje-whisper">{whisper}</p>
      ) : null}

      {capsule.is_unlocked ? (
        <div className="relative z-[1] space-y-2 border-t-[2px] border-nje-border/15 pt-2">
          {capsule.content.trim() ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-nje-border">{capsule.content.trim()}</p>
          ) : null}
          {thumb && imgView ? (
            <a href={imgView} target="_blank" rel="noreferrer" className="block overflow-hidden border-[2px] border-nje-border bg-nje-bg">
              <img src={thumb} alt="" className="aspect-video w-full object-cover" loading="lazy" />
            </a>
          ) : null}
          {capsule.media_url && !fid ? (
            <a
              href={capsule.media_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex text-xs font-bold uppercase tracking-wide text-nje-border underline decoration-nje-border/40 underline-offset-2"
            >
              Open linked media
            </a>
          ) : null}
          {videoEmbed ? (
            <div className="overflow-hidden border-[2px] border-nje-border bg-nje-bg shadow-[0_2px_0_0_rgba(90,46,30,0.06)]">
              <iframe title="Capsule film" src={videoEmbed} className="aspect-video w-full" allowFullScreen />
            </div>
          ) : null}
          {capsule.capsule_type === 'voice' && capsule.media_url?.startsWith('http') ? (
            <audio controls className="w-full" src={capsule.media_url} preload="metadata" />
          ) : null}
        </div>
      ) : (
        <p className="relative z-[1] text-[10px] leading-relaxed text-nje-whisper">
          The words and film inside stay hidden until the hour you chose.
        </p>
      )}
    </motion.article>
  )
}
