import type { MessageRow } from './message'

export type PinnedMomentRow = {
  id: string
  message_id: string
  pair_key: string
  pinned_by: string
  pinned_at: string
  context_label: string | null
  message: MessageRow
}
