/**
 * Sends Web Push payloads when a row is inserted into `public.notifications`.
 *
 * Configure: Database → Webhooks → INSERT on `notifications` → POST to this function URL
 * with header `x-webhook-secret: <NOTIFY_WEBHOOK_SECRET>` (same value in Edge secrets).
 *
 * Secrets: NOTIFY_WEBHOOK_SECRET, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (e.g. mailto:you@domain),
 * SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (usually auto-set on Supabase).
 */
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.6'

type NotificationRecord = {
  id: string
  user_id: string
  kind: string
  title: string
  body: string
}

type WebhookBody = {
  type?: string
  record?: NotificationRecord
  /** Some webhook payloads nest differently */
  notification?: NotificationRecord
}

function getRecord(body: WebhookBody): NotificationRecord | null {
  if (body.record?.user_id) return body.record
  if (body.notification?.user_id) return body.notification
  return null
}

function prefsAllowWebPush(kind: string, row: Record<string, unknown> | null): boolean {
  if (!row) return kind !== 'presence'
  const col: Record<string, string> = {
    message: 'notify_message',
    media: 'notify_media',
    streak: 'notify_streak',
    time_capsule: 'notify_time_capsule',
    shared_collection: 'notify_shared_collection',
    presence: 'notify_presence',
  }
  const key = col[kind] ?? 'notify_message'
  const v = row[key]
  return v !== false
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'method' }), { status: 405 })
  }

  const secret = Deno.env.get('NOTIFY_WEBHOOK_SECRET')
  const got = req.headers.get('x-webhook-secret') ?? ''
  if (!secret || got !== secret) {
    return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), { status: 401 })
  }

  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY')
  const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY')
  const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:nje@localhost'

  if (!url || !serviceKey || !vapidPublic || !vapidPrivate) {
    return new Response(JSON.stringify({ ok: false, error: 'missing_env' }), { status: 503 })
  }

  let body: WebhookBody
  try {
    body = (await req.json()) as WebhookBody
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'json' }), { status: 400 })
  }

  const record = getRecord(body)
  if (!record?.user_id) {
    return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200 })
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

  const { data: prefs } = await admin
    .from('notification_preferences')
    .select('*')
    .eq('user_id', record.user_id)
    .maybeSingle()

  const prow = prefs as Record<string, unknown> | null
  if (!prefsAllowWebPush(record.kind, prow)) {
    return new Response(JSON.stringify({ ok: true, skipped: 'kind_pref' }), { status: 200 })
  }

  const { data: subs, error: subErr } = await admin
    .from('push_subscriptions')
    .select('endpoint, subscription')
    .eq('user_id', record.user_id)

  if (subErr || !subs?.length) {
    return new Response(JSON.stringify({ ok: true, sent: 0 }), { status: 200 })
  }

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)

  const payload = JSON.stringify({
    title: record.title || 'nje',
    body: (record.body || '').slice(0, 200),
    url: record.kind === 'streak' ? '/ritual' : '/chat',
  })

  let sent = 0
  for (const row of subs) {
    const pushSub = row.subscription as { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
    if (!pushSub?.endpoint || !pushSub.keys?.p256dh || !pushSub.keys?.auth) continue
    try {
      // web-push accepts JSON-shaped subscription from PushSubscription.toJSON()
      await webpush.sendNotification(pushSub as never, payload, { TTL: 3600 })
      sent += 1
    } catch {
      /* subscription may be stale — ignore */
    }
  }

  return new Response(JSON.stringify({ ok: true, sent }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
})
