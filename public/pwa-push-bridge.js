/* Web Push handlers — loaded into the main Workbox service worker via importScripts. */
/* global self */

const NJE_ICON = '/pwa-192.png'

self.addEventListener('push', (event) => {
  let payload = { title: 'nje', body: '', url: '/chat' }
  try {
    if (event.data) {
      const j = event.data.json()
      if (j && typeof j === 'object') {
        payload = { ...payload, ...j }
      }
    }
  } catch {
    /* ignore */
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || 'nje', {
      body: payload.body || '',
      icon: NJE_ICON,
      badge: NJE_ICON,
      silent: false,
      data: { url: payload.url || '/chat' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification?.data?.url || '/chat'
  const absolute = new URL(url, self.location.origin).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const c of clientList) {
        if (!c.url) continue
        if ('focus' in c) {
          if ('navigate' in c && typeof c.navigate === 'function') {
            return c.navigate(absolute).then(() => c.focus())
          }
          return c.focus()
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(absolute)
    }),
  )
})
