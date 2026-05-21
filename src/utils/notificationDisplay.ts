import type { NotificationKind } from '../types/notification'

const KIND_LABEL: Record<NotificationKind, string> = {
  message: 'Note',
  media: 'Moment',
  streak: 'Ritual',
  time_capsule: 'Capsule',
  shared_collection: 'Collection',
  presence: 'Presence',
}

export function notificationKindLabel(kind: NotificationKind): string {
  return KIND_LABEL[kind] ?? kind
}

/** Soft relative label for inbox rows. */
export function formatNotificationTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const sameDay =
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  }
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const ySame =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  if (ySame) return `Yesterday · ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function kindAllowsBrowserPush(
  kind: NotificationKind,
  prefs: {
    notify_message: boolean
    notify_media: boolean
    notify_streak: boolean
    notify_time_capsule: boolean
    notify_shared_collection: boolean
    notify_presence: boolean
  },
): boolean {
  switch (kind) {
    case 'message':
      return prefs.notify_message
    case 'media':
      return prefs.notify_media
    case 'streak':
      return prefs.notify_streak
    case 'time_capsule':
      return prefs.notify_time_capsule
    case 'shared_collection':
      return prefs.notify_shared_collection
    case 'presence':
      return prefs.notify_presence
    default:
      return true
  }
}
