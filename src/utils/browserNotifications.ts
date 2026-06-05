/** Browser + service worker notifications styled for nje. */

import type { NotificationKind } from '../types/notification'
import { notificationUrlForKind } from './notificationDelivery'

const NJE_ICON = '/pwa-192.png'

export function browserNotificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!browserNotificationsSupported()) return 'unsupported'
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!browserNotificationsSupported()) return 'unsupported'
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission
  }
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

export type NjeBrowserNotificationInput = {
  id: string
  title: string
  body: string
  kind: NotificationKind
}

export function showNjeBrowserNotification(input: NjeBrowserNotificationInput) {
  if (!browserNotificationsSupported()) return
  if (Notification.permission !== 'granted') return

  const url = notificationUrlForKind(input.kind)
  const body = input.body.slice(0, 200)

  try {
    const n = new Notification(input.title, {
      body,
      tag: `nje-${input.id}`,
      icon: NJE_ICON,
      badge: NJE_ICON,
      silent: false,
      data: { url },
    })
    n.onclick = () => {
      try {
        window.focus()
        const target = n.data?.url ?? url
        if (typeof target === 'string' && target.length > 0) {
          window.location.assign(target)
        }
      } finally {
        n.close()
      }
    }
  } catch {
    /* ignore */
  }
}

/** @deprecated Use showNjeBrowserNotification */
export function showQuietBrowserNotification(title: string, options?: NotificationOptions) {
  if (!browserNotificationsSupported()) return
  if (Notification.permission !== 'granted') return
  try {
    new Notification(title, {
      icon: NJE_ICON,
      badge: NJE_ICON,
      silent: false,
      ...options,
    })
  } catch {
    /* ignore */
  }
}
