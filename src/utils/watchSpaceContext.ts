import type { PresenceStatusId } from '../types/presenceStatus'

/** Tiny emotional labels on shared watch rows — optional, calm. */
export const WATCH_CONTEXT_WHISPER: Record<string, string> = {
  late_night: 'Saved in a late, quiet hour',
  night_mode: 'Marked while the thread was dim',
  focus: 'Added during focus time',
}

export function deriveWatchContextLabel(status: PresenceStatusId, d = new Date()): string | null {
  if (status === 'studying') return 'focus'
  const h = d.getHours()
  if (h >= 22 || h < 7) return 'late_night'
  return null
}
