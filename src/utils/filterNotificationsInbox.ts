import type { NotificationRow } from '../types/notification'

type RowWithMessageDelete = NotificationRow & {
  message?: { deleted_at: string | null } | null
}

/** Hide pings whose referenced chat row was soft-deleted (tombstone). */
export function filterNotificationsInbox<T extends RowWithMessageDelete>(rows: T[]): NotificationRow[] {
  return rows
    .filter((r) => {
      if (!r.ref_message_id) return true
      const deletedAt = r.message?.deleted_at
      return deletedAt == null
    })
    .map(({ message: _m, ...row }) => row as NotificationRow)
}
