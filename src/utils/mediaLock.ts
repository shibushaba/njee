import type { MessageRow } from '../types/message'

/** Media was sent with a finite view budget (once / twice). */
export function mediaHasViewLimit(m: Pick<MessageRow, 'view_limit'>): boolean {
  return m.view_limit != null && m.view_limit > 0
}

import { isMediaPastExpiry } from './mediaExpiry'

/** Row is exhausted: server lock, counts reached limit, expiry passed, or message removed. */
export function isMediaViewLocked(
  m: Pick<MessageRow, 'view_limit' | 'current_views' | 'is_locked' | 'message_type' | 'deleted_at' | 'media_expires_at' | 'media_url'>,
): boolean {
  if (m.deleted_at) return true
  if (m.message_type !== 'image' && m.message_type !== 'video' && m.message_type !== 'voice') return false
  if (!m.media_url) return true
  if (isMediaPastExpiry(m)) return true
  if (m.is_locked) return true
  if (!mediaHasViewLimit(m)) return false
  const limit = m.view_limit as number
  return m.current_views >= limit
}

/** Opens remaining for limited media (0 when locked). */
export function mediaOpensLeft(m: Pick<MessageRow, 'view_limit' | 'current_views'>): number | null {
  if (!mediaHasViewLimit(m)) return null
  const limit = m.view_limit as number
  return Math.max(0, limit - m.current_views)
}
