import { purgeLockedMediaAfterLock } from './media.service'
import type { MessageRow } from '../types/message'
import { isMediaPastExpiry } from '../utils/mediaExpiry'
import { isGdriveMediaRef } from '../utils/gdriveMediaUrl'
import { isLimitedMediaExhausted, mediaHasViewLimit } from '../utils/limitedMediaViews'

function isPurgeableMedia(m: MessageRow): boolean {
  if (m.deleted_at) return false
  if (m.message_type !== 'image' && m.message_type !== 'video' && m.message_type !== 'voice') return false
  return Boolean(m.media_url)
}

/** View-count exhausted OR past media_expires_at. */
export function shouldPurgeMediaRow(m: MessageRow): boolean {
  if (!isPurgeableMedia(m)) return false
  if (isMediaPastExpiry(m)) return true
  if (isLimitedMediaExhausted(m)) return true
  if (m.is_locked && mediaHasViewLimit(m)) return true
  return false
}

/**
 * Purge Storage / Drive blob and clear message media columns (idempotent per message id).
 */
export async function purgeMediaRow(m: MessageRow): Promise<{ cleared: boolean; error?: string }> {
  if (!m.media_url) return { cleared: true }
  return purgeLockedMediaAfterLock(m.media_url, m.id)
}

export async function sweepMediaLifecycle(
  messages: MessageRow[],
  onPatched: (id: string, patch: Partial<MessageRow>) => void,
  attempted: Set<string>,
): Promise<number> {
  let count = 0
  for (const m of messages) {
    if (!shouldPurgeMediaRow(m) || attempted.has(m.id)) continue
    attempted.add(m.id)
    const r = await purgeMediaRow(m)
    if (!r.cleared) {
      attempted.delete(m.id)
      continue
    }
    onPatched(m.id, {
      media_url: null,
      media_type: null,
      is_locked: true,
      media_expires_at: null,
    })
    count += 1
  }
  return count
}

export function isLegacyMemoriesMedia(m: MessageRow): boolean {
  return (
    (m.message_type === 'image' || m.message_type === 'video' || m.message_type === 'voice') &&
    Boolean(m.media_url) &&
    !m.deleted_at &&
    (m.media_surface === 'memories' || m.media_surface == null)
  )
}

export function isChatThreadMedia(m: MessageRow): boolean {
  return (
    (m.message_type === 'image' || m.message_type === 'video' || m.message_type === 'voice') &&
    Boolean(m.media_url) &&
    !m.deleted_at &&
    m.media_surface === 'chat'
  )
}

export function mediaStorageKind(m: MessageRow): 'supabase' | 'gdrive' | null {
  if (!m.media_url) return null
  if (isGdriveMediaRef(m.media_url)) return 'gdrive'
  if (m.media_surface === 'chat' || m.media_surface === 'memories') return 'supabase'
  return isGdriveMediaRef(m.media_url) ? 'gdrive' : 'supabase'
}
