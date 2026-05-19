import { useMemo } from 'react'
import type { MessageRow } from '../types/message'
import { isMediaViewLocked, mediaHasViewLimit, mediaOpensLeft } from '../utils/mediaLock'

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
  const isUnlimited = message.view_limit == null
  const hasLimit = mediaHasViewLimit(message)
  const isEphemeral = hasLimit

  const isLocked = useMemo(() => isMediaViewLocked(message), [
    message.current_views,
    message.deleted_at,
    message.is_locked,
    message.message_type,
    message.view_limit,
  ])

  const opensLeft = useMemo(() => {
    if (!hasLimit || isUnlimited) return null
    return mediaOpensLeft(message)
  }, [hasLimit, isUnlimited, message.current_views, message.view_limit])

  const canOpen = useMemo(() => {
    if (message.message_type !== 'image' && message.message_type !== 'video') return false
    if (!message.media_url) return false
    return !isLocked
  }, [isLocked, message.media_url, message.message_type])

  return {
    isUnlimited,
    hasLimit,
    isEphemeral,
    isLocked,
    canOpen,
    opensLeft,
  }
}
