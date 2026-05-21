/* global self */
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
      silent: true,
      data: { url: payload.url || '/chat' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification?.data?.url || '/chat'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const c of clientList) {
        if (c.url && 'focus' in c) return c.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    }),
  )
})
