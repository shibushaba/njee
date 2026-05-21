import { supabase } from '../lib/supabase'
import type {
  NotificationKind,
  NotificationPreferencesPatch,
  NotificationPreferencesRow,
  NotificationRow,
} from '../types/notification'

const NOTIFICATION_KINDS: NotificationKind[] = [
  'message',
  'media',
  'streak',
  'time_capsule',
  'shared_collection',
  'presence',
]

function isNotificationKind(s: string): s is NotificationKind {
  return NOTIFICATION_KINDS.includes(s as NotificationKind)
}

function normalizeNotification(row: Record<string, unknown>): NotificationRow {
  const kind = String(row.kind ?? '')
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    kind: isNotificationKind(kind) ? kind : 'message',
    title: String(row.title ?? ''),
    body: String(row.body ?? ''),
    actor_id: row.actor_id != null ? String(row.actor_id) : null,
    ref_message_id: row.ref_message_id != null ? String(row.ref_message_id) : null,
    meta: (row.meta && typeof row.meta === 'object' ? row.meta : {}) as Record<string, unknown>,
    read_at: row.read_at != null ? String(row.read_at) : null,
    created_at: String(row.created_at ?? ''),
  }
}

function normalizePrefs(row: Record<string, unknown>): NotificationPreferencesRow {
  return {
    user_id: String(row.user_id),
    notify_message: Boolean(row.notify_message ?? true),
    notify_media: Boolean(row.notify_media ?? true),
    notify_streak: Boolean(row.notify_streak ?? true),
    notify_time_capsule: Boolean(row.notify_time_capsule ?? true),
    notify_shared_collection: Boolean(row.notify_shared_collection ?? true),
    notify_presence: Boolean(row.notify_presence ?? false),
    browser_push: Boolean(row.browser_push ?? false),
    updated_at: String(row.updated_at ?? ''),
  }
}

export const defaultNotificationPreferences = (): Omit<
  NotificationPreferencesRow,
  'user_id' | 'updated_at'
> => ({
  notify_message: true,
  notify_media: true,
  notify_streak: true,
  notify_time_capsule: true,
  notify_shared_collection: true,
  notify_presence: false,
  browser_push: false,
})

export async function fetchNotifications(userId: string, limit = 80) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { data: [] as NotificationRow[], error }
  return {
    data: (data ?? []).map((r) => normalizeNotification(r as Record<string, unknown>)),
    error: null,
  }
}

export async function fetchUnreadNotificationCount(userId: string) {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null)

  if (error) return { count: 0, error }
  return { count: count ?? 0, error: null }
}

export async function markNotificationRead(userId: string, id: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)

  return { error }
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null)

  return { error }
}

export async function fetchNotificationPreferences(userId: string) {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) return { data: null as NotificationPreferencesRow | null, error }
  if (!data) return { data: null as NotificationPreferencesRow | null, error: null }
  return { data: normalizePrefs(data as Record<string, unknown>), error: null }
}

export async function upsertNotificationPreferences(
  userId: string,
  patch: NotificationPreferencesPatch,
) {
  const existingRes = await fetchNotificationPreferences(userId)
  const d = defaultNotificationPreferences()
  const e = existingRes.data
  const merged = {
    user_id: userId,
    notify_message: patch.notify_message ?? e?.notify_message ?? d.notify_message,
    notify_media: patch.notify_media ?? e?.notify_media ?? d.notify_media,
    notify_streak: patch.notify_streak ?? e?.notify_streak ?? d.notify_streak,
    notify_time_capsule: patch.notify_time_capsule ?? e?.notify_time_capsule ?? d.notify_time_capsule,
    notify_shared_collection:
      patch.notify_shared_collection ?? e?.notify_shared_collection ?? d.notify_shared_collection,
    notify_presence: patch.notify_presence ?? e?.notify_presence ?? d.notify_presence,
    browser_push: patch.browser_push ?? e?.browser_push ?? d.browser_push,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert(merged, { onConflict: 'user_id' })
    .select('*')
    .single()

  if (error) return { data: null as NotificationPreferencesRow | null, error }
  return { data: normalizePrefs(data as Record<string, unknown>), error: null }
}

export function subscribeNotifications(
  userId: string,
  onChange: (row: NotificationRow, event: 'INSERT' | 'UPDATE') => void,
): () => void {
  const topic = `nje-notifications:${userId}`
  const channel = supabase
    .channel(topic)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const ev = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE'
        if (ev === 'DELETE') return
        const raw = (ev === 'INSERT' ? payload.new : payload.new) as Record<string, unknown> | undefined
        if (!raw) return
        onChange(normalizeNotification(raw), ev)
      },
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

export function subscribeNotificationPreferences(
  userId: string,
  onRow: (row: NotificationPreferencesRow | null) => void,
): () => void {
  const topic = `nje-notification-prefs:${userId}`
  const channel = supabase
    .channel(topic)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notification_preferences',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          onRow(null)
          return
        }
        const raw = payload.new as Record<string, unknown> | undefined
        if (!raw) return
        onRow(normalizePrefs(raw))
      },
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
