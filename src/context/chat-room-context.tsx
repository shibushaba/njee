import { createContext, useContext } from 'react'
import type { MessageRow } from '../types/message'
import type { ReplyInsertMeta } from '../utils/messageReply'
import type { MediaSendViewMode } from '../utils/mediaViewMode'

export type ChatRoomContextValue = {
  messages: MessageRow[]
  loading: boolean
  error: string | null
  sending: boolean
  peerId: string | null
  peerUsername: string | null
  myUsername: string | null
  currentId: string | null
  peerOnline: boolean
  peerTyping: boolean
  roomConnected: boolean
  sendMessage: (text: string, opts?: { reply?: ReplyInsertMeta | null }) => Promise<{ error: string | null }>
  sendMedia: (
    file: File,
    caption: string,
    opts: { viewMode: MediaSendViewMode; reply?: ReplyInsertMeta | null },
    onUploadProgress?: (pct: number) => void,
  ) => Promise<{ error: string | null }>
  deleteMessage: (messageId: string) => Promise<{ error: string | null }>
  notifyTyping: (active: boolean) => void
  reload: () => Promise<void>
  patchMessage: (messageId: string, patch: Partial<MessageRow>) => void
}

export const ChatRoomContext = createContext<ChatRoomContextValue | null>(null)

export function useChatRoom() {
  const ctx = useContext(ChatRoomContext)
  if (!ctx) {
    throw new Error('useChatRoom must be used within ChatRoomProvider')
  }
  return ctx
}
