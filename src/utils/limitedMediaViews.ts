import type { MessageRow } from '../types/message'
import type { MediaViewMode } from '../types/message'

const STORAGE_KEY = 'nje_limited_media_views'

function readMap(): Record<string, number> {
  if (typeof sessionStorage === 'undefined') return {}
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as Record<string, number>
  } catch {
    return {}
  }
}

function writeMap(map: Record<string, number>) {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    /* quota / private mode */
  }
}

export function getSessionViewCount(messageId: string): number {
  const n = readMap()[messageId]
  return typeof n === 'number' && n >= 0 ? n : 0
}

/** Increment local open count (survives failed RPC / missing view_limit on server). */
export function bumpSessionViewCount(messageId: string): number {
  const map = readMap()
  const next = (map[messageId] ?? 0) + 1
  map[messageId] = next
  writeMap(map)
  return next
}

export function effectiveViewCount(messageId: string, serverViews: number): number {
  return Math.max(serverViews, getSessionViewCount(messageId))
}

export function mediaViewModeFromRow(
  m: Pick<MessageRow, 'media_view_mode' | 'view_limit'>,
): MediaViewMode | null {
  if (m.media_view_mode === 'once' || m.media_view_mode === 'twice' || m.media_view_mode === 'keep') {
    return m.media_view_mode
  }
  if (m.view_limit === 1) return 'once'
  if (m.view_limit === 2) return 'twice'
  return null
}

/** Finite opens (once / twice). Ignores 24h shelf. */
export function mediaViewLimitValue(m: Pick<MessageRow, 'media_view_mode' | 'view_limit'>): number | null {
  const mode = mediaViewModeFromRow(m)
  if (mode === 'once') return 1
  if (mode === 'twice') return 2
  if (m.view_limit != null && m.view_limit > 0) return m.view_limit
  return null
}

export function mediaHasViewLimit(m: Pick<MessageRow, 'media_view_mode' | 'view_limit'>): boolean {
  return mediaViewLimitValue(m) != null
}

export function canOpenLimitedMedia(
  m: Pick<
    MessageRow,
    'id' | 'sender_id' | 'receiver_id' | 'media_view_mode' | 'view_limit' | 'current_views' | 'is_locked' | 'media_url' | 'deleted_at'
  >,
  viewerId: string | null,
): boolean {
  if (!viewerId || m.deleted_at || !m.media_url) return false
  const limit = mediaViewLimitValue(m)
  if (limit == null) return true
  if (viewerId === m.sender_id) return false
  if (viewerId !== m.receiver_id) return false
  if (m.is_locked) return false
  return effectiveViewCount(m.id, m.current_views) < limit
}

export function isLimitedMediaExhausted(
  m: Pick<MessageRow, 'id' | 'media_view_mode' | 'view_limit' | 'current_views' | 'is_locked' | 'media_url'>,
): boolean {
  const limit = mediaViewLimitValue(m)
  if (limit == null) return false
  if (!m.media_url) return true
  if (m.is_locked) return true
  return effectiveViewCount(m.id, m.current_views) >= limit
}

export type LimitedViewApplyResult = {
  current_views: number
  is_locked: boolean
  exhausted: boolean
}

/** Merge server RPC + session so once/twice always advance even when RPC says unlimited. */
export function applyLimitedViewOpen(
  messageId: string,
  viewLimit: number,
  serverViewsBefore: number,
  rpc: { ok?: boolean; locked?: boolean; unlimited?: boolean; current_views?: number },
): LimitedViewApplyResult {
  const sessionCount = bumpSessionViewCount(messageId)
  let next = Math.max(sessionCount, serverViewsBefore + 1)
  if (typeof rpc.current_views === 'number' && rpc.current_views > 0) {
    next = Math.max(next, rpc.current_views)
  }
  const exhausted = next >= viewLimit
  return {
    current_views: next,
    is_locked: exhausted || Boolean(rpc.locked),
    exhausted,
  }
}
