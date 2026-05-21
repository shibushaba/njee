/** Convert VAPID public key from base64url to Uint8Array for PushManager.subscribe. */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) {
    out[i] = raw.charCodeAt(i)
  }
  return out
}

export function isWebPushConfigured(): boolean {
  const k = import.meta.env.VITE_VAPID_PUBLIC_KEY
  return typeof k === 'string' && k.length > 20
}

export function webPushPublicKey(): string | undefined {
  const k = import.meta.env.VITE_VAPID_PUBLIC_KEY
  return typeof k === 'string' && k.length > 0 ? k : undefined
}

export function supportsServiceWorkerPush(): boolean {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window
}
