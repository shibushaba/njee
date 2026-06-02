import { useMemo } from 'react'
import type { MessageRow } from '../types/message'
import { canOpenLimitedMedia, mediaHasViewLimit, mediaOpensLeft } from '../utils/mediaLock'
import { isMediaViewLocked } from '../utils/mediaLock'

export type MediaViewsState = {
  isUnlimited: boolean
  hasLimit: boolean
  /** view_once / view_twice style (no in-thread preview). */
  isEphemeral: boolean
  isLocked: boolean
  canOpen: boolean
  /** Opens remaining before lock (after current_views recorded opens). */
  opensLeft: number | null
}

export function useMediaViews(message: MessageRow): MediaViewsState {
  const hasLimit = mediaHasViewLimit(message)
  const isUnlimited = !hasLimit

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
    if (hasLimit) return canOpenLimitedMedia(message)
    return true
  }, [hasLimit, isLocked, message])

  return {
    isUnlimited,
    hasLimit,
    isEphemeral: hasLimit,
    isLocked,
    canOpen,
    opensLeft,
  }
}
