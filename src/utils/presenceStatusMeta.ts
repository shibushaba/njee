import type { PresenceStatusId } from '../types/presenceStatus'

export const PRESENCE_LABEL: Record<PresenceStatusId, string> = {
  active_now: 'Here',
  sleeping: 'Resting',
  studying: 'In focus',
  away: 'Stepped away',
}

export const PRESENCE_WHISPER: Record<PresenceStatusId, string> = {
  active_now: 'Present in the room',
  sleeping: 'Soft night — dimmed',
  studying: 'Reduced motion, calmer pings',
  away: 'Not at the screen',
}

/** Ambient UI tokens (no flashy gamification). */
export function presenceAmbientClass(status: PresenceStatusId): string {
  switch (status) {
    case 'sleeping':
      return 'opacity-[0.72] brightness-[0.92] saturate-[0.65]'
    case 'studying':
      return 'opacity-95 motion-reduce:opacity-100'
    case 'away':
      return 'opacity-85'
    default:
      return ''
  }
}

export function presenceRowTone(status: PresenceStatusId): 'default' | 'night' | 'focus' {
  if (status === 'sleeping') return 'night'
  if (status === 'studying') return 'focus'
  return 'default'
}

/** When false, skip badges / moon / extra copy — online + name are enough. */
export function presenceShowsAmbient(status: PresenceStatusId): boolean {
  return status !== 'active_now'
}
