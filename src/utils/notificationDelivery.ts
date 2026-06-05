import type { NotificationKind } from '../types/notification'

export function notificationUrlForKind(kind: NotificationKind): string {
  switch (kind) {
    case 'streak':
      return '/ritual'
    case 'pinned_moment':
      return '/moments'
    case 'watch_shelf':
      return '/lounge/watch'
    case 'time_capsule':
      return '/lounge/capsules'
    case 'shared_collection':
      return '/memories'
    case 'presence':
      return '/chat'
    case 'message':
    case 'media':
    default:
      return '/chat'
  }
}

/** Foreground tab → in-app toast. */
export function shouldDeliverInAppToast(visibility: DocumentVisibilityState): boolean {
  return visibility === 'visible'
}

/** Background tab → OS notification (requires permission). */
export function shouldDeliverOsNotification(
  visibility: DocumentVisibilityState,
  permission: NotificationPermission | 'unsupported',
): boolean {
  return visibility === 'hidden' && permission === 'granted'
}
