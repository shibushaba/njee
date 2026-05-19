import { useChatRoom } from '../context/chat-room-context'

export function useTyping() {
  const { peerTyping, notifyTyping } = useChatRoom()
  return { peerTyping, notifyTyping }
}
