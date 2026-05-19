import type { MessageRow } from '../types/message'

const SNIPPET_MAX = 160

export type ReplyInsertMeta = {
  replyToMessageId: string
  replySnippet: string
  replyMessageType: MessageRow['message_type']
  replySenderId: string
}

/** Snapshot of a message for reply metadata at send time. */
export function buildReplyInsertMeta(target: MessageRow): ReplyInsertMeta {
  if (target.deleted_at) {
    return {
      replyToMessageId: target.id,
      replySnippet: 'This message was deleted',
      replyMessageType: 'text',
      replySenderId: target.sender_id,
    }
  }
  if (target.message_type === 'text') {
    const t = target.content.trim().slice(0, SNIPPET_MAX)
    return {
      replyToMessageId: target.id,
      replySnippet: t.length > 0 ? t : 'Message',
      replyMessageType: 'text',
      replySenderId: target.sender_id,
    }
  }
  if (target.message_type === 'image') {
    return {
      replyToMessageId: target.id,
      replySnippet: 'Photo',
      replyMessageType: 'image',
      replySenderId: target.sender_id,
    }
  }
  return {
    replyToMessageId: target.id,
    replySnippet: 'Video',
    replyMessageType: 'video',
    replySenderId: target.sender_id,
  }
}
