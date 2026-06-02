import { supabase } from '../lib/supabase'
import type {
  NotificationKind,
  NotificationPreferencesPatch,
  NotificationPreferencesRow,
  NotificationRow,
} from '../types/notification'
import { filterNotificationsInbox } from '../utils/filterNotificationsInbox'

const NOTIFICATION_SELECT = '*, message:messages!ref_message_id(deleted_at)'

const NOTIFICATION_KINDS: NotificationKind[] = [
  'message',
  'media',
  'streak',
  'time_capsule',
  'shared_collection',
  'presence',
  'pinned_moment',
  'watch_shelf',
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
    notify_pinned_moment: Boolean(row.notify_pinned_moment ?? true),
    notify_watch_shelf: Boolean(row.notify_watch_shelf ?? true),
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
  notify_pinned_moment: true,
  notify_watch_shelf: true,
  browser_push: false,
})

export async function fetchNotifications(userId: string, limit = 80) {
  const { data, error } = await supabase
    .from('notifications')
    .select(NOTIFICATION_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { data: [] as NotificationRow[], error }
  const mapped = (data ?? []).map((r) => {
    const raw = r as Record<string, unknown> & { message?: { deleted_at: string | null } | null }
    const { message, ...rest } = raw
    return {
      ...normalizeNotification(rest as Record<string, unknown>),
      message: message ?? null,
    }
  })
  return {
    data: filterNotificationsInbox(mapped),
    error: null,
  }
}

export async function fetchUnreadNotificationCount(userId: string) {
  const { data, error } = await supabase.rpc('count_unread_notifications', { p_user: userId })

  if (!error && typeof data === 'number') {
    return { count: data, error: null }
  }

  const { data: rows, error: fallbackError } = await supabase
    .from('notifications')
    .select(NOTIFICATION_SELECT)
    .eq('user_id', userId)
    .is('read_at', null)

  if (fallbackError) return { count: 0, error: fallbackError }
  const count = filterNotificationsInbox(
    (rows ?? []).map((r) => ({
      ...normalizeNotification(r as Record<string, unknown>),
      message: (r as { message?: { deleted_at: string | null } | null }).message ?? null,
    })),
  ).length
  return { count, error: null }
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
    notify_pinned_moment: patch.notify_pinned_moment ?? e?.notify_pinned_moment ?? d.notify_pinned_moment,
    notify_watch_shelf: patch.notify_watch_shelf ?? e?.notify_watch_shelf ?? d.notify_watch_shelf,
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
  onDelete?: (notificationId: string) => void,
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
        if (ev === 'DELETE') {
          const old = payload.old as Record<string, unknown> | undefined
          if (old?.id != null) onDelete?.(String(old.id))
          return
        }
        const raw = payload.new as Record<string, unknown> | undefined
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
