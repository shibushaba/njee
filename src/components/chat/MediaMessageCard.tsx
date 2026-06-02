import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import type { MessageRow } from '../../types/message'
import { formatChatTime } from '../../utils/formatChatTime'
import { cn } from '../../lib/cn'
import { useMediaViews } from '../../hooks/useMediaViews'
import { useLongPress } from '../../hooks/useLongPress'
import { createSignedMediaUrl } from '../../services/media.service'
import { parseGdriveFileId, publicDriveThumbnailUrl } from '../../utils/gdriveMediaUrl'
import { mediaViewLimitValue } from '../../utils/limitedMediaViews'
import { resolveMediaViewPill } from '../../utils/mediaViewPill'
import type { FullscreenMediaPayload } from '../../types/mediaViewer'
import { MediaViewPill } from './MediaViewPill'
import { InlineMessageReply } from './InlineMessageReply'
import { ViewCounterBadge } from './ViewCounterBadge'

type MediaMessageCardProps = {
  message: MessageRow
  isOwn: boolean
  showSeen: boolean
  currentUserId: string | null
  peerUsername: string | null
  onOpenMedia: (payload: FullscreenMediaPayload) => void
  onOpenActions?: (message: MessageRow) => void
}

function withViewBudget(message: MessageRow, payload: FullscreenMediaPayload): FullscreenMediaPayload {
  return {
    ...payload,
    viewLimit: mediaViewLimitValue(message),
    currentViews: message.current_views,
  }
}

export function MediaMessageCard({
  message,
  isOwn,
  showSeen,
  currentUserId,
  peerUsername,
  onOpenMedia,
  onOpenActions,
}: MediaMessageCardProps) {
  const { isLocked, canOpen, hasLimit, isUnlimited, isEphemeral, isShelfPill, opensLeft } = useMediaViews(
    message,
    currentUserId,
  )
  const mediaKind =
    message.message_type === 'video' ? 'video' : message.message_type === 'voice' ? 'voice' : 'image'
  const pill = resolveMediaViewPill(message, currentUserId)
  const useCompactPill = isEphemeral || isShelfPill

  const [opening, setOpening] = useState(false)
  const [openError, setOpenError] = useState<string | null>(null)

  const openFullscreen = useCallback(async () => {
    const mediaUrl = message.media_url
    if (!canOpen || !mediaUrl) return
    setOpenError(null)
    setOpening(true)
    const res = await createSignedMediaUrl(mediaUrl, {
      mediaKind,
      fullMedia: true,
    })
    setOpening(false)
    if (res.error || (!res.url && !(message.message_type === 'video' && res.driveVideoEmbedUrl))) {
      setOpenError(res.error ?? 'Could not open')
      return
    }
    const fileId = parseGdriveFileId(mediaUrl)
    const base = {
      messageId: message.id,
      caption: message.content.trim() || undefined,
    }
    if (message.message_type === 'image') {
      onOpenMedia(
        withViewBudget(message, {
          kind: 'image',
          url: res.url ?? '',
          ...base,
          driveFileId: fileId ?? undefined,
          storagePath: fileId ? null : mediaUrl,
        }),
      )
    } else if (message.message_type === 'video') {
      onOpenMedia(
        withViewBudget(message, {
          kind: 'video',
          url: res.url ?? (fileId ? publicDriveThumbnailUrl(fileId) : ''),
          ...base,
          driveFileId: fileId ?? undefined,
          driveVideoEmbedUrl: res.driveVideoEmbedUrl ?? undefined,
          storagePath: fileId ? null : mediaUrl,
        }),
      )
    } else {
      onOpenMedia(
        withViewBudget(message, {
          kind: 'voice',
          url: res.url ?? '',
          ...base,
          storagePath: mediaUrl,
        }),
      )
    }
  }, [canOpen, mediaKind, message, onOpenMedia])

  const caption = message.content.trim()
  const ephemeralLimit = message.view_limit ?? 1
  const ephemeralOpensLeft = opensLeft ?? ephemeralLimit

  const replyAuthor =
    message.reply_sender_id && currentUserId && message.reply_sender_id === currentUserId
      ? 'You'
      : (peerUsername ?? '—')

  const openMenu = useCallback(() => {
    onOpenActions?.(message)
  }, [message, onOpenActions])

  const longPress = useLongPress(() => {
    openMenu()
  })

  const pillBody = (
    <MediaViewPill
      kind={mediaKind}
      kindLabel={pill.kindLabel}
      badge={pill.badge}
      ring={pill.ring}
      opening={opening}
      exhausted={pill.exhausted}
    />
  )

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className={cn('flex w-full touch-pan-y', isOwn ? 'justify-end' : 'justify-start')}
      {...longPress}
      onContextMenu={(e) => {
        e.preventDefault()
        openMenu()
      }}
    >
      <div
        className={cn(
          'w-full max-w-[70%] border-[2px] border-nje-border shadow-[0_2px_0_0_rgba(90,46,30,0.05)]',
          isOwn ? 'bg-nje-yellow' : 'bg-nje-pink',
        )}
      >
        {message.reply_to_message_id && message.reply_snippet ? (
          <div className="border-b-[2px] border-nje-border px-2.5 pt-1.5">
            <InlineMessageReply snippet={message.reply_snippet} authorLabel={replyAuthor} />
          </div>
        ) : null}

        {useCompactPill ? (
          <div className="relative">
            {pill.interactive ? (
              <button
                type="button"
                onClick={() => void openFullscreen()}
                disabled={opening}
                className={cn(
                  'block w-full text-left outline-none transition-opacity',
                  'focus-visible:opacity-95 disabled:cursor-not-allowed',
                )}
                aria-label={`Open ${pill.kindLabel}, ${pill.badge}`}
              >
                {pillBody}
              </button>
            ) : (
              <div className="w-full" aria-label={`${pill.kindLabel}, ${pill.badge}`}>
                {pillBody}
              </div>
            )}
            {openError ? (
              <p className="border-t-[2px] border-nje-border bg-nje-bg px-2 py-1.5 text-center text-[0.7rem] font-medium text-nje-border">
                {openError}
              </p>
            ) : null}
          </div>
        ) : null}

        {caption ? (
          <p className="border-t-[2px] border-nje-border px-2.5 py-1.5 text-sm leading-snug text-nje-border">
            {caption}
          </p>
        ) : null}

        <div
          className={cn(
            'flex flex-wrap items-center gap-x-1.5 gap-y-0.5 border-t-[2px] border-nje-border px-2.5 py-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.1em] text-nje-border/70',
            isOwn ? 'justify-end' : 'justify-start',
          )}
        >
          <time dateTime={message.created_at}>{formatChatTime(message.created_at)}</time>
          {!useCompactPill ? (
            <ViewCounterBadge
              hasLimit={hasLimit}
              isUnlimited={isUnlimited}
              isLocked={isLocked}
              currentViews={message.current_views}
              viewLimit={message.view_limit}
            />
          ) : isEphemeral && !isOwn ? (
            <span className="text-nje-whisper">
              {isLocked ? 'Opened' : `${ephemeralOpensLeft} left`}
            </span>
          ) : null}
          {isOwn && showSeen ? (
            <span className="border-l-[2px] border-nje-border/25 pl-1.5">
              {message.seen ? 'Seen' : <span className="text-nje-whisper">Sent</span>}
            </span>
          ) : null}
        </div>
      </div>
    </motion.article>
  )
}
