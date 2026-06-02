import type { MessageRow } from '../types/message'
import type { MediaViewMode } from '../types/message'
import {
  effectiveViewCount,
  isLimitedMediaExhausted,
  mediaHasViewLimit,
  mediaViewLimitValue,
  mediaViewModeFromRow,
} from './limitedMediaViews'
import { isMediaPastExpiry } from './mediaExpiry'

export type MediaPillRing = 'none' | 'half' | 'full'

export type MediaViewPillModel = {
  kindLabel: string
  badge: string
  ring: MediaPillRing
  /** Receiver can tap to open in fullscreen. */
  interactive: boolean
  exhausted: boolean
  mode: MediaViewMode | 'keep' | null
}

function kindLabel(message: MessageRow): string {
  if (message.message_type === 'video') return 'Video'
  if (message.message_type === 'voice') return 'Voice'
  return 'Photo'
}

export function resolveMediaViewMode(message: MessageRow): MediaViewMode | 'keep' | null {
  const mode = mediaViewModeFromRow(message)
  if (mode) return mode
  if (message.media_expires_at) return 'keep'
  return null
}

export function resolveMediaViewPill(
  message: MessageRow,
  viewerId: string | null,
): MediaViewPillModel {
  const label = kindLabel(message)
  const mode = resolveMediaViewMode(message)
  const limit = mediaViewLimitValue(message)
  const views = effectiveViewCount(message.id, message.current_views)
  const isReceiver = Boolean(viewerId && viewerId === message.receiver_id)
  const exhausted =
    !message.media_url ||
    message.is_locked ||
    isLimitedMediaExhausted(message) ||
    (mode === 'keep' && isMediaPastExpiry(message))

  if (mode === 'keep' || (!mediaHasViewLimit(message) && message.media_expires_at)) {
    return {
      kindLabel: label,
      badge: exhausted ? 'opened' : '24hrs',
      ring: 'none',
      interactive: !exhausted && Boolean(message.media_url),
      exhausted,
      mode: 'keep',
    }
  }

  if (limit === 1) {
    const done = exhausted || views >= 1
    return {
      kindLabel: label,
      badge: done ? 'opened' : '1',
      ring: 'none',
      interactive: !done && isReceiver && Boolean(message.media_url),
      exhausted: done,
      mode: 'once',
    }
  }

  if (limit === 2) {
    const done = exhausted || views >= 2
    const ring: MediaPillRing = done ? 'none' : views >= 1 ? 'half' : 'full'
    return {
      kindLabel: label,
      badge: done ? 'opened' : '2',
      ring,
      interactive: !done && isReceiver && Boolean(message.media_url),
      exhausted: done,
      mode: 'twice',
    }
  }

  return {
    kindLabel: label,
    badge: '24hrs',
    ring: 'none',
    interactive: !exhausted && Boolean(message.media_url),
    exhausted,
    mode: null,
  }
}
