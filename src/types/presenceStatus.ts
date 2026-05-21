/** All values allowed in DB / Realtime. */
export const PRESENCE_STATUS_IDS = ['active_now', 'sleeping', 'studying', 'away'] as const

/** Manual picks in the UI — default `active_now` is “usual”; online already shows that. */
export const MANUAL_PRESENCE_PICK_IDS = ['away', 'sleeping', 'studying'] as const satisfies readonly PresenceStatusId[]

export type PresenceStatusId = (typeof PRESENCE_STATUS_IDS)[number]

export function isPresenceStatusId(s: string): s is PresenceStatusId {
  return (PRESENCE_STATUS_IDS as readonly string[]).includes(s)
}

export type ProfilePresenceRow = {
  id: string
  username: string
  presence_status: PresenceStatusId
  presence_updated_at: string
}
