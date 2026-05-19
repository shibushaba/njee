export type MediaSendViewMode = 'once' | 'twice' | 'unlimited'

export function viewLimitFromSendMode(mode: MediaSendViewMode): number | null {
  if (mode === 'once') return 1
  if (mode === 'twice') return 2
  return null
}

export function sendModeLabel(mode: MediaSendViewMode): string {
  if (mode === 'once') return 'View once'
  if (mode === 'twice') return 'Twice'
  return 'Keep'
}
