import type { ChatMediaKind } from '../types/message'
import type { MediaSendViewMode } from './mediaViewMode'

const DAY_MS = 24 * 60 * 60 * 1000

export function mediaExpiresAtFromNow(hours = 24): string {
  return new Date(Date.now() + hours * 3600000).toISOString()
}

/** Voice = reopen until end of day window. Keep = same 24h window with unlimited opens. */
export function resolveMediaSendPolicy(
  kind: ChatMediaKind,
  viewMode: MediaSendViewMode,
): { viewLimit: number | null; mediaExpiresAt: string | null } {
  if (kind === 'voice') {
    return { viewLimit: null, mediaExpiresAt: mediaExpiresAtFromNow(24) }
  }
  if (viewMode === 'once') {
    return { viewLimit: 1, mediaExpiresAt: null }
  }
  if (viewMode === 'twice') {
    return { viewLimit: 2, mediaExpiresAt: null }
  }
  return { viewLimit: null, mediaExpiresAt: mediaExpiresAtFromNow(24) }
}

export function isMediaPastExpiry(row: { media_expires_at: string | null }): boolean {
  if (!row.media_expires_at) return false
  const t = new Date(row.media_expires_at).getTime()
  return !Number.isNaN(t) && t <= Date.now()
}

export function msUntilMediaExpiry(row: { media_expires_at: string | null }): number | null {
  if (!row.media_expires_at) return null
  const t = new Date(row.media_expires_at).getTime()
  if (Number.isNaN(t)) return null
  return Math.max(0, t - Date.now())
}

/** Human hint for Keep / voice (24h shelf). */
export function keepExpiryHint(expiresAt: string | null): string | null {
  if (!expiresAt) return null
  const ms = msUntilMediaExpiry({ media_expires_at: expiresAt })
  if (ms == null) return null
  if (ms <= 0) return 'Expires soon'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (h >= 1) return `Leaves in ~${h}h`
  return `Leaves in ~${m}m`
}

export { DAY_MS }
