import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './useAuth'
import {
  defaultNotificationPreferences,
  fetchNotificationPreferences,
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeNotificationPreferences,
  subscribeNotifications,
  upsertNotificationPreferences,
} from '../services/notification.service'
import { getNotificationPermission, showNjeBrowserNotification } from '../utils/browserNotifications'
import {
  notificationUrlForKind,
  shouldDeliverInAppToast,
  shouldDeliverOsNotification,
} from '../utils/notificationDelivery'
import { kindAllowsBrowserPush } from '../utils/notificationDisplay'
import type { NotificationPreferencesPatch, NotificationPreferencesRow, NotificationRow } from '../types/notification'

export type UseNotificationsOptions = {
  /** When false, skip inbox fetch + realtime (e.g. settings page only needs prefs). */
  inbox?: boolean
  /** Foreground delivery — in-app toast. */
  onNewNotification?: (row: NotificationRow) => void
}

function effectivePrefsFromRef(
  prefs: NotificationPreferencesRow | null,
): Omit<NotificationPreferencesRow, 'user_id' | 'updated_at'> {
  if (!prefs) return defaultNotificationPreferences()
  return {
    notify_message: prefs.notify_message,
    notify_media: prefs.notify_media,
    notify_streak: prefs.notify_streak,
    notify_time_capsule: prefs.notify_time_capsule,
    notify_shared_collection: prefs.notify_shared_collection,
    notify_presence: prefs.notify_presence,
    notify_pinned_moment: prefs.notify_pinned_moment,
    notify_watch_shelf: prefs.notify_watch_shelf,
    browser_push: prefs.browser_push,
  }
}

function deliverNotification(
  row: NotificationRow,
  prefs: NotificationPreferencesRow | null,
  onNewNotification: ((row: NotificationRow) => void) | undefined,
) {
  const p = effectivePrefsFromRef(prefs)
  if (!kindAllowsBrowserPush(row.kind, p)) return

  const visibility = typeof document !== 'undefined' ? document.visibilityState : 'visible'
  const permission = getNotificationPermission()

  if (shouldDeliverInAppToast(visibility)) {
    onNewNotification?.(row)
    return
  }

  if (shouldDeliverOsNotification(visibility, permission)) {
    showNjeBrowserNotification({
      id: row.id,
      title: row.title,
      body: row.body,
      kind: row.kind,
    })
  }
}

export function useNotifications(options?: UseNotificationsOptions) {
  const inbox = options?.inbox !== false
  const { user } = useAuth()
  const userId = user?.id ?? null

  const [items, setItems] = useState<NotificationRow[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loadingInbox, setLoadingInbox] = useState(false)
  const [prefs, setPrefs] = useState<NotificationPreferencesRow | null>(null)
  const [loadingPrefs, setLoadingPrefs] = useState(false)
  const prefsRef = useRef<NotificationPreferencesRow | null>(null)
  const onNewNotificationRef = useRef(options?.onNewNotification)
  onNewNotificationRef.current = options?.onNewNotification

  useEffect(() => {
    prefsRef.current = prefs
  }, [prefs])

  const refreshUnread = useCallback(async () => {
    if (!userId) {
      setUnreadCount(0)
      return
    }
    const { count } = await fetchUnreadNotificationCount(userId)
    setUnreadCount(count)
  }, [userId])

  const loadInbox = useCallback(async () => {
    if (!userId || !inbox) return
    setLoadingInbox(true)
    const [{ data, error }, countRes] = await Promise.all([
      fetchNotifications(userId),
      fetchUnreadNotificationCount(userId),
    ])
    if (!error) setItems(data)
    setUnreadCount(countRes.count)
    setLoadingInbox(false)
  }, [userId, inbox])

  const ensurePrefs = useCallback(async () => {
    if (!userId) return
    setLoadingPrefs(true)
    let { data, error } = await fetchNotificationPreferences(userId)
    if (!error && !data) {
      const up = await upsertNotificationPreferences(userId, defaultNotificationPreferences())
      data = up.data
      error = up.error
    }
    if (!error && data) {
      setPrefs(data)
      if (getNotificationPermission() === 'granted' && !data.browser_push) {
        const sync = await upsertNotificationPreferences(userId, { browser_push: true })
        if (sync.data) setPrefs(sync.data)
      }
    }
    setLoadingPrefs(false)
  }, [userId])

  useEffect(() => {
    void ensurePrefs()
  }, [ensurePrefs])

  useEffect(() => {
    if (!userId || !inbox) return
    void loadInbox()
  }, [userId, inbox, loadInbox])

  useEffect(() => {
    if (!userId || !inbox) return
    const unsub = subscribeNotifications(
      userId,
      (row, event) => {
        setItems((prev) => {
          if (event === 'INSERT') {
            const next = [row, ...prev.filter((r) => r.id !== row.id)]
            return next.slice(0, 100)
          }
          return prev.map((r) => (r.id === row.id ? row : r))
        })
        void refreshUnread()

        if (event === 'INSERT') {
          deliverNotification(row, prefsRef.current, onNewNotificationRef.current)
        }
      },
      (id) => {
        setItems((prev) => prev.filter((r) => r.id !== id))
        void refreshUnread()
      },
    )
    return unsub
  }, [userId, inbox, refreshUnread])

  useEffect(() => {
    if (!userId) return
    const unsub = subscribeNotificationPreferences(userId, (row) => {
      if (row) setPrefs(row)
      else void ensurePrefs()
    })
    return unsub
  }, [userId, ensurePrefs])

  const markRead = useCallback(
    async (id: string) => {
      if (!userId) return { error: 'no user' }
      const { error } = await markNotificationRead(userId, id)
      if (!error) {
        setItems((prev) => prev.map((r) => (r.id === id ? { ...r, read_at: new Date().toISOString() } : r)))
        void refreshUnread()
      }
      return { error: error?.message ?? null }
    },
    [userId, refreshUnread],
  )

  const markAllRead = useCallback(async () => {
    if (!userId) return { error: 'no user' }
    const { error } = await markAllNotificationsRead(userId)
    if (!error) {
      setItems((prev) => prev.map((r) => ({ ...r, read_at: r.read_at ?? new Date().toISOString() })))
      setUnreadCount(0)
    }
    return { error: error?.message ?? null }
  }, [userId])

  const updatePreferences = useCallback(
    async (patch: NotificationPreferencesPatch) => {
      if (!userId) return { error: 'no user' as const, data: null as NotificationPreferencesRow | null }
      const { data, error } = await upsertNotificationPreferences(userId, patch)
      if (!error && data) setPrefs(data)
      return { data, error: error?.message ?? null }
    },
    [userId],
  )

  const effectivePrefs = useMemo((): Omit<NotificationPreferencesRow, 'user_id' | 'updated_at'> => {
    return effectivePrefsFromRef(prefs)
  }, [prefs])

  return {
    userId,
    items,
    unreadCount,
    loadingInbox,
    prefs,
    effectivePrefs,
    loadingPrefs,
    refreshInbox: loadInbox,
    refreshUnread,
    markRead,
    markAllRead,
    updatePreferences,
    ensurePreferences: ensurePrefs,
    notificationUrlForKind,
    /** Local smoke test for toast + OS notification delivery. */
    testNotificationDelivery: (onNewNotification?: (row: NotificationRow) => void) => {
      const row: NotificationRow = {
        id: `test-${Date.now()}`,
        user_id: userId ?? '',
        kind: 'message',
        title: 'Test ping',
        body: 'If you see this, gentle notifications are working.',
        actor_id: null,
        ref_message_id: null,
        meta: {},
        read_at: null,
        created_at: new Date().toISOString(),
      }
      deliverNotification(row, prefsRef.current, onNewNotification)
    },
  }
}
