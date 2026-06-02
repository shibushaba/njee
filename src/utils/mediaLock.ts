import type { MessageRow } from '../types/message'
import { isMediaPastExpiry } from './mediaExpiry'
import {
  canOpenLimitedMedia,
  effectiveViewCount,
  isLimitedMediaExhausted,
  mediaHasViewLimit,
  mediaViewLimitValue,
} from './limitedMediaViews'

export { mediaHasViewLimit, mediaViewLimitValue, canOpenLimitedMedia, effectiveViewCount }

/** 24h shelf (Keep / voice) — reopen until expiry, not view-count limited. */
export function isTimedShelfMedia(m: Pick<MessageRow, 'media_expires_at' | 'media_view_mode' | 'view_limit'>): boolean {
  if (mediaHasViewLimit(m)) return false
  return m.media_expires_at != null
}

/** Row is exhausted: server lock, counts reached limit, expiry passed, or message removed. */
export function isMediaViewLocked(
  m: Pick<
    MessageRow,
    | 'id'
    | 'view_limit'
    | 'media_view_mode'
    | 'current_views'
    | 'is_locked'
    | 'message_type'
    | 'deleted_at'
    | 'media_expires_at'
    | 'media_url'
  >,
): boolean {
  if (m.deleted_at) return true
  if (m.message_type !== 'image' && m.message_type !== 'video' && m.message_type !== 'voice') return false
  if (!m.media_url) return true
  if (isMediaPastExpiry(m)) return true
  if (isLimitedMediaExhausted(m)) return true
  if (m.is_locked && mediaHasViewLimit(m)) return true
  return false
}

/** Opens remaining for limited media (0 when locked). */
export function mediaOpensLeft(
  m: Pick<MessageRow, 'id' | 'view_limit' | 'media_view_mode' | 'current_views' | 'media_expires_at'>,
): number | null {
  const limit = mediaViewLimitValue(m)
  if (limit == null) return null
  return Math.max(0, limit - effectiveViewCount(m.id, m.current_views))
}
