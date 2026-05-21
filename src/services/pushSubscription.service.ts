import { supabase } from '../lib/supabase'
import { supportsServiceWorkerPush, urlBase64ToUint8Array, webPushPublicKey } from '../utils/webPush'

const SW_PATH = '/sw.js'

export async function getPushSubscriptionJson(): Promise<PushSubscriptionJSON | null> {
  if (!supportsServiceWorkerPush()) return null
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  return sub?.toJSON() ?? null
}

export async function registerServiceWorkerForPush(): Promise<ServiceWorkerRegistration | null> {
  if (!supportsServiceWorkerPush()) return null
  try {
    const existing = await navigator.serviceWorker.getRegistration()
    if (existing) {
      await existing.update()
      return existing
    }
    return await navigator.serviceWorker.register(SW_PATH, { scope: '/' })
  } catch {
    return null
  }
}

/** Subscribe this browser and save row for Web Push (requires auth + VAPID env). */
export async function subscribeWebPushAndSave(userId: string): Promise<{ error: string | null }> {
  const vapid = webPushPublicKey()
  if (!vapid || !supportsServiceWorkerPush()) {
    return { error: 'Web Push is not configured on this build (missing VAPID public key or unsupported browser).' }
  }

  const reg = await registerServiceWorkerForPush()
  if (!reg) return { error: 'Could not register the service worker.' }

  await reg.update()

  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapid) as BufferSource,
    })
  }

  const json = sub.toJSON()
  if (!json.keys?.p256dh || !json.keys?.auth || !json.endpoint) {
    return { error: 'Incomplete push subscription from browser.' }
  }

  const { data: sessionData } = await supabase.auth.getSession()
  if (sessionData.session?.user?.id !== userId) {
    return { error: 'You must be signed in as this user to register push on this device.' }
  }

  const { error } = await supabase.rpc('save_my_push_subscription', {
    p_endpoint: json.endpoint,
    p_subscription: json as unknown as Record<string, unknown>,
  })

  return { error: error?.message ?? null }
}

export async function isThisDeviceWebPushRegistered(userId: string): Promise<boolean> {
  const json = await getPushSubscriptionJson()
  if (!json?.endpoint) return false
  const { data } = await supabase
    .from('push_subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('endpoint', json.endpoint)
    .maybeSingle()
  return Boolean(data)
}

/** Remove this device from Web Push. */
export async function unsubscribeWebPushAndRemove(userId: string): Promise<{ error: string | null }> {
  if (!supportsServiceWorkerPush()) return { error: null }

  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  const endpoint = sub?.endpoint

  if (sub) {
    try {
      await sub.unsubscribe()
    } catch {
      /* ignore */
    }
  }

  if (endpoint) {
    const { error } = await supabase.from('push_subscriptions').delete().eq('user_id', userId).eq('endpoint', endpoint)
    return { error: error?.message ?? null }
  }

  return { error: null }
}
