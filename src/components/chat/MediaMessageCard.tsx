import { useCallback, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import type { MessageRow } from '../../types/message'
import { formatChatTime } from '../../utils/formatChatTime'
import { cn } from '../../lib/cn'
import { useSignedMediaUrl } from '../../hooks/useSignedMediaUrl'
import { useMediaViews } from '../../hooks/useMediaViews'
import { useLongPress } from '../../hooks/useLongPress'
import { createSignedMediaUrl } from '../../services/media.service'
import { isGdriveMediaRef, parseGdriveFileId, publicDriveThumbnailUrl } from '../../utils/gdriveMediaUrl'
import type { FullscreenMediaPayload } from '../../types/mediaViewer'
import { EphemeralMediaPlaceholder } from './EphemeralMediaPlaceholder'
import { InlineMessageReply } from './InlineMessageReply'
import { LockedMediaCard } from './LockedMediaCard'
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
    viewLimit: message.view_limit,
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
  const rootRef = useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef, { once: true, margin: '48px' })
  const { isLocked, canOpen, hasLimit, isUnlimited, isEphemeral, opensLeft } = useMediaViews(message)
  const shouldLoadThreadPreview = !isEphemeral && !isLocked && inView
  const mediaKind =
    message.message_type === 'video' ? 'video' : message.message_type === 'voice' ? 'voice' : 'image'
  const { url, loading, error } = useSignedMediaUrl(message.media_url, shouldLoadThreadPreview, mediaKind)

  const [openingEphemeral, setOpeningEphemeral] = useState(false)
  const [ephemeralError, setEphemeralError] = useState<string | null>(null)

  const openUnlimited = useCallback(() => {
    const mediaUrl = message.media_url
    if (!canOpen || !mediaUrl) return
    if (isGdriveMediaRef(mediaUrl)) {
      void (async () => {
        const fileId = parseGdriveFileId(mediaUrl)
        if (!fileId) return
        const res = await createSignedMediaUrl(mediaUrl, {
          mediaKind,
          fullMedia: true,
        })
        if (res.error) return
        if (!res.url && !(mediaKind === 'video' && res.driveVideoEmbedUrl)) return
        onOpenMedia(
          withViewBudget(message, {
            kind: mediaKind === 'video' ? 'video' : mediaKind === 'voice' ? 'voice' : 'image',
            url: res.url ?? publicDriveThumbnailUrl(fileId),
            messageId: message.id,
            caption: message.content.trim() || undefined,
            driveFileId: fileId,
            driveVideoEmbedUrl: res.driveVideoEmbedUrl ?? undefined,
          }),
        )
      })()
      return
    }
    if (!url) return
    if (message.message_type === 'image') {
      onOpenMedia(
        withViewBudget(message, {
          kind: 'image',
          url,
          messageId: message.id,
          caption: message.content.trim() || undefined,
          storagePath: isGdriveMediaRef(message.media_url) ? null : message.media_url,
        }),
      )
    } else if (message.message_type === 'video') {
      onOpenMedia(
        withViewBudget(message, {
          kind: 'video',
          url,
          messageId: message.id,
          caption: message.content.trim() || undefined,
          storagePath: isGdriveMediaRef(message.media_url) ? null : message.media_url,
        }),
      )
    } else if (message.message_type === 'voice') {
      onOpenMedia(
        withViewBudget(message, {
          kind: 'voice',
          url,
          messageId: message.id,
          caption: message.content.trim() || undefined,
          storagePath: message.media_url,
        }),
      )
    }
  }, [canOpen, mediaKind, message, onOpenMedia, url])

  const openEphemeral = useCallback(async () => {
    const mediaUrl = message.media_url
    if (!canOpen || !mediaUrl) return
    setEphemeralError(null)
    setOpeningEphemeral(true)
    const res = await createSignedMediaUrl(mediaUrl, {
      mediaKind,
      fullMedia: true,
    })
    setOpeningEphemeral(false)
    if (res.error || (!res.url && !(message.message_type === 'video' && res.driveVideoEmbedUrl))) {
      setEphemeralError(res.error ?? 'Could not open')
      return
    }
    const fileId = parseGdriveFileId(mediaUrl)
    if (message.message_type === 'image') {
      onOpenMedia(
        withViewBudget(message, {
          kind: 'image',
          url: res.url ?? '',
          messageId: message.id,
          caption: message.content.trim() || undefined,
          driveFileId: fileId ?? undefined,
          storagePath: fileId ? null : mediaUrl,
        }),
      )
    } else if (message.message_type === 'video') {
      onOpenMedia(
        withViewBudget(message, {
          kind: 'video',
          url: res.url ?? (fileId ? publicDriveThumbnailUrl(fileId) : ''),
          messageId: message.id,
          caption: message.content.trim() || undefined,
          driveFileId: fileId ?? undefined,
          driveVideoEmbedUrl: res.driveVideoEmbedUrl ?? undefined,
          storagePath: fileId ? null : mediaUrl,
        }),
      )
    } else if (message.message_type === 'voice') {
      onOpenMedia(
        withViewBudget(message, {
          kind: 'voice',
          url: res.url ?? '',
          messageId: message.id,
          caption: message.content.trim() || undefined,
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

  return (
    <motion.article
      ref={rootRef}
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
        {isLocked ? (
          <motion.div
            key="locked"
            layout
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <LockedMediaCard storagePath={message.media_url} kind={mediaKind} />
          </motion.div>
        ) : isEphemeral ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => void openEphemeral()}
              disabled={!canOpen || openingEphemeral}
              className={cn(
                'group relative block w-full overflow-hidden text-left outline-none transition-shadow duration-150',
                'focus-visible:shadow-[0_3px_0_0_rgba(90,46,30,0.08)] disabled:cursor-not-allowed disabled:opacity-50',
              )}
              aria-label={
                message.message_type === 'video'
                  ? `Open full-screen video (${ephemeralOpensLeft} of ${ephemeralLimit} opens left)`
                  : message.message_type === 'voice'
                    ? `Open voice note (${ephemeralOpensLeft} of ${ephemeralLimit} opens left)`
                    : `Open full-screen photo (${ephemeralOpensLeft} of ${ephemeralLimit} opens left)`
              }
            >
              <EphemeralMediaPlaceholder
                kind={mediaKind}
                opening={openingEphemeral}
                viewLimit={ephemeralLimit}
                opensLeft={ephemeralOpensLeft}
              />
            </button>
            {ephemeralError ? (
              <p className="border-t-[2px] border-nje-border bg-nje-bg px-2 py-1.5 text-center text-[0.7rem] font-medium text-nje-border">
                {ephemeralError}
              </p>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            onClick={openUnlimited}
            disabled={!url || Boolean(error) || !canOpen}
            className={cn(
              'group relative block w-full overflow-hidden text-left outline-none transition-shadow duration-150',
              'focus-visible:shadow-[0_3px_0_0_rgba(90,46,30,0.08)] disabled:cursor-default',
            )}
            aria-label={message.message_type === 'video' ? 'Open video' : 'Open image'}
          >
            <div className="relative max-h-[min(40vh,12rem)] min-h-[5rem] w-full bg-nje-bg sm:max-h-[min(42vh,13rem)]">
              {loading ? (
                <div className="absolute inset-0 animate-pulse bg-nje-surface/90" aria-hidden />
              ) : null}
              {error ? (
                <div className="flex h-full min-h-[4.5rem] items-center justify-center px-3 text-center text-xs font-medium text-nje-border">
                  {error}
                </div>
              ) : null}
              {!error && url && message.message_type === 'image' ? (
                <img
                  src={url}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="mx-auto h-full max-h-[min(40vh,12rem)] w-full object-cover transition-transform duration-300 group-hover:scale-[1.01] group-focus-visible:scale-[1.01] sm:max-h-[min(42vh,13rem)]"
                />
              ) : null}
              {!error && url && message.message_type === 'video' && isGdriveMediaRef(message.media_url) ? (
                <div className="relative mx-auto h-full max-h-[min(40vh,12rem)] w-full sm:max-h-[min(42vh,13rem)]">
                  <img
                    src={url}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover opacity-95"
                  />
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="border-[2px] border-nje-border bg-nje-surface/90 px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-nje-border shadow-[0_2px_0_0_rgba(90,46,30,0.06)]">
                      Video
                    </span>
                  </span>
                </div>
              ) : null}
              {!error && url && message.message_type === 'video' && !isGdriveMediaRef(message.media_url) ? (
                <div className="relative mx-auto h-full max-h-[min(40vh,12rem)] w-full sm:max-h-[min(42vh,13rem)]">
                  <video
                    src={url}
                    muted
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover opacity-95"
                  />
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="border-[2px] border-nje-border bg-nje-surface/90 px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-nje-border shadow-[0_2px_0_0_rgba(90,46,30,0.06)]">
                      Video
                    </span>
                  </span>
                </div>
              ) : null}
            </div>
          </button>
        )}

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
          <ViewCounterBadge
            hasLimit={hasLimit}
            isUnlimited={isUnlimited}
            isLocked={isLocked}
            currentViews={message.current_views}
            viewLimit={message.view_limit}
          />
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
