/** Best-effort browser notifications (PWA push can reuse prefs later). */

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

export function showQuietBrowserNotification(title: string, options?: NotificationOptions) {
  if (!browserNotificationsSupported()) return
  if (Notification.permission !== 'granted') return
  try {
    new Notification(title, {
      silent: true,
      ...options,
    })
  } catch {
    /* ignore */
  }
}
