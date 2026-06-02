import { useMemo } from 'react'
import type { MessageRow } from '../types/message'
import { canOpenLimitedMedia, mediaHasViewLimit, mediaOpensLeft } from '../utils/mediaLock'
import { isMediaViewLocked } from '../utils/mediaLock'
import { resolveMediaViewMode } from '../utils/mediaViewPill'

export type MediaViewsState = {
  isUnlimited: boolean
  hasLimit: boolean
  /** view_once / view_twice — compact pill, receiver opens only. */
  isEphemeral: boolean
  /** keep / voice — 24h pill, both can open. */
  isShelfPill: boolean
  isLocked: boolean
  canOpen: boolean
  opensLeft: number | null
}

export function useMediaViews(message: MessageRow, currentUserId: string | null): MediaViewsState {
  const hasLimit = mediaHasViewLimit(message)
  const mode = resolveMediaViewMode(message)
  const isShelfPill = mode === 'keep' || Boolean(message.media_expires_at && !hasLimit)
  const isUnlimited = !hasLimit && !isShelfPill

  const isLocked = useMemo(() => isMediaViewLocked(message), [
    message.id,
    message.current_views,
    message.deleted_at,
    message.is_locked,
    message.message_type,
    message.view_limit,
    message.media_view_mode,
    message.media_expires_at,
    message.media_url,
  ])

  const opensLeft = useMemo(() => {
    if (!hasLimit) return null
    return mediaOpensLeft(message)
  }, [hasLimit, message.id, message.current_views, message.view_limit, message.media_view_mode])

  const canOpen = useMemo(() => {
    if (message.message_type !== 'image' && message.message_type !== 'video' && message.message_type !== 'voice') {
      return false
    }
    if (!message.media_url) return false
    if (isLocked) return false
    if (hasLimit) return canOpenLimitedMedia(message, currentUserId)
    return true
  }, [currentUserId, hasLimit, isLocked, message])

  return {
    isUnlimited,
    hasLimit,
    isEphemeral: hasLimit,
    isShelfPill,
    isLocked,
    canOpen,
    opensLeft,
  }
}
