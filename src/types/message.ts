export type ChatMediaKind = 'image' | 'video' | 'voice'

export type MessageType = 'text' | ChatMediaKind

export type MessageRow = {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  seen: boolean
  message_type: MessageType
  media_url: string | null
  media_type: ChatMediaKind | null
  view_limit: number | null
  current_views: number
  is_locked: boolean
  deleted_at: string | null
  reply_to_message_id: string | null
  reply_snippet: string | null
  reply_message_type: MessageType | null
  reply_sender_id: string | null
  /** chat = Supabase thread media; memories = shelf (Drive when configured). */
  media_surface: 'chat' | 'memories' | null
  /** Keep + voice: purge blob after this time (~24h from send). */
  media_expires_at: string | null
}

export type ProfileRow = {
  id: string
  username: string
  updated_at?: string
}
