export type TimeCapsuleType = 'text' | 'image' | 'video' | 'voice'

export type TimeCapsuleRow = {
  id: string
  pair_key: string
  sender_id: string
  receiver_id: string
  capsule_title: string | null
  content: string
  capsule_type: TimeCapsuleType
  media_url: string | null
  media_type: 'image' | 'video' | null
  unlock_at: string
  is_unlocked: boolean
  unlocked_at: string | null
  created_at: string
  context_label: string | null
  /** 0 = legacy plaintext at rest; 1 = AES-GCM blob in `content`. */
  encryption_version: number
}
