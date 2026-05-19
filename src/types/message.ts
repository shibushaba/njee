export type ChatMediaKind = 'image' | 'video'

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
}

export type ProfileRow = {
  id: string
  username: string
  updated_at?: string
}
