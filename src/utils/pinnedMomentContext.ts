import type { PresenceStatusId } from '../types/presenceStatus'

/** Soft labels stored on pin rows — warm, not gamified. */
export const PIN_CONTEXT_WHISPER: Record<string, string> = {
  late_night: 'Pinned during a late, quiet thread',
  study_mode: 'Saved while in focus',
  resting: 'Saved during rest mode',
}

export function derivePinContextLabel(status: PresenceStatusId, d = new Date()): string | null {
  if (status === 'studying') return 'study_mode'
  if (status === 'sleeping') return 'resting'
  const h = d.getHours()
  if (status === 'active_now' && (h >= 22 || h < 7)) return 'late_night'
  return null
}
