import { supabase } from '../lib/supabase'
import type { ChatMediaKind, MessageRow } from '../types/message'
import type { ReplyInsertMeta } from '../utils/messageReply'

export function normalizeMessageRow(row: unknown): MessageRow {
  const r = row as Record<string, unknown>
  const mt = r.message_type as MessageRow['message_type'] | undefined
  const safeType: MessageRow['message_type'] =
    mt === 'text' || mt === 'image' || mt === 'video' || mt === 'voice' ? mt : 'text'

  const rmt = r.reply_message_type as string | null | undefined
  const safeReplyType: MessageRow['message_type'] | null =
    rmt === 'text' || rmt === 'image' || rmt === 'video' || rmt === 'voice' ? rmt : null

  return {
    id: String(r.id),
    sender_id: String(r.sender_id),
    receiver_id: String(r.receiver_id),
    content: String(r.content ?? ''),
    created_at: String(r.created_at),
    seen: Boolean(r.seen),
    message_type: safeType,
    media_url: r.media_url != null ? String(r.media_url) : null,
    media_type: (r.media_type as ChatMediaKind | null | undefined) ?? null,
    view_limit: r.view_limit == null ? null : Number(r.view_limit),
    current_views: Number(r.current_views ?? 0),
    is_locked: Boolean(r.is_locked),
    deleted_at: r.deleted_at != null ? String(r.deleted_at) : null,
    reply_to_message_id: r.reply_to_message_id != null ? String(r.reply_to_message_id) : null,
    reply_snippet: r.reply_snippet != null ? String(r.reply_snippet) : null,
    reply_message_type: safeReplyType,
    reply_sender_id: r.reply_sender_id != null ? String(r.reply_sender_id) : null,
    media_surface:
      r.media_surface === 'chat' || r.media_surface === 'memories' ? r.media_surface : null,
    media_expires_at: r.media_expires_at != null ? String(r.media_expires_at) : null,
  }
}

export async function fetchPeerProfile(currentUserId: string) {
  return supabase
    .from('profiles')
    .select('id, username')
    .neq('id', currentUserId)
    .maybeSingle()
}

export async function fetchConversation(currentUserId: string, peerId: string) {
  const [outbound, inbound] = await Promise.all([
    supabase
      .from('messages')
      .select('*')
      .eq('sender_id', currentUserId)
      .eq('receiver_id', peerId)
      .order('created_at', { ascending: true }),
    supabase
      .from('messages')
      .select('*')
      .eq('sender_id', peerId)
      .eq('receiver_id', currentUserId)
      .order('created_at', { ascending: true }),
  ])

  const err = outbound.error ?? inbound.error
  if (err) {
    return { data: null as MessageRow[] | null, error: err }
  }

  const a = (outbound.data ?? []).map(normalizeMessageRow)
  const b = (inbound.data ?? []).map(normalizeMessageRow)
  const merged = [...a, ...b].sort(
    (x, y) => new Date(x.created_at).getTime() - new Date(y.created_at).getTime(),
  )

  return { data: merged, error: null }
}

export async function sendTextMessage(
  senderId: string,
  receiverId: string,
  content: string,
  opts?: { reply?: ReplyInsertMeta | null },
) {
  const trimmed = content.trim()
  const reply = opts?.reply
  return supabase
    .from('messages')
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      content: trimmed,
      message_type: 'text',
      seen: false,
      reply_to_message_id: reply?.replyToMessageId ?? null,
      reply_snippet: reply?.replySnippet ?? null,
      reply_message_type: reply?.replyMessageType ?? null,
      reply_sender_id: reply?.replySenderId ?? null,
    })
    .select()
    .single()
}

export async function sendMediaMessage(
  senderId: string,
  receiverId: string,
  params: {
    mediaPath: string
    mediaType: ChatMediaKind
    caption: string
    viewLimit?: number | null
    mediaExpiresAt?: string | null
    mediaSurface?: 'chat' | 'memories'
    isLocked?: boolean
    reply?: ReplyInsertMeta | null
  },
) {
  const caption = params.caption.trim()
  const reply = params.reply
  return supabase
    .from('messages')
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      content: caption,
      message_type: params.mediaType,
      media_url: params.mediaPath,
      media_type: params.mediaType,
      seen: false,
      view_limit: params.viewLimit ?? null,
      media_expires_at: params.mediaExpiresAt ?? null,
      media_surface: params.mediaSurface ?? null,
      current_views: 0,
      is_locked: params.isLocked ?? false,
      reply_to_message_id: reply?.replyToMessageId ?? null,
      reply_snippet: reply?.replySnippet ?? null,
      reply_message_type: reply?.replyMessageType ?? null,
      reply_sender_id: reply?.replySenderId ?? null,
    })
    .select()
    .single()
}

/** Soft-delete for everyone (sender-only, tombstone row). */
export async function softDeleteMessage(senderId: string, messageId: string) {
  return supabase
    .from('messages')
    .update({
      deleted_at: new Date().toISOString(),
      media_url: null,
      media_type: null,
      view_limit: null,
      current_views: 0,
      is_locked: false,
      message_type: 'text',
      content: '',
    })
    .eq('id', messageId)
    .eq('sender_id', senderId)
    .select()
    .single()
}

export async function markMessagesSeen(receiverId: string, senderId: string) {
  return supabase
    .from('messages')
    .update({ seen: true })
    .eq('receiver_id', receiverId)
    .eq('sender_id', senderId)
    .eq('seen', false)
}
