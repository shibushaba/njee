export type NotificationKind =
  | 'message'
  | 'media'
  | 'streak'
  | 'time_capsule'
  | 'shared_collection'
  | 'presence'

export type NotificationRow = {
  id: string
  user_id: string
  kind: NotificationKind
  title: string
  body: string
  actor_id: string | null
  ref_message_id: string | null
  meta: Record<string, unknown>
  read_at: string | null
  created_at: string
}

export type NotificationPreferencesRow = {
  user_id: string
  notify_message: boolean
  notify_media: boolean
  notify_streak: boolean
  notify_time_capsule: boolean
  notify_shared_collection: boolean
  notify_presence: boolean
  browser_push: boolean
  updated_at: string
}

export type NotificationPreferencesPatch = Partial<
  Omit<NotificationPreferencesRow, 'user_id' | 'updated_at'>
>
