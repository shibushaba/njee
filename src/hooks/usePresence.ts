import { useChatRoom } from '../context/chat-room-context'

export function usePresence() {
  const {
    peerOnline,
    myUsername,
    peerUsername,
    currentId,
    peerId,
    roomConnected,
    peerPresenceStatus,
    myPresenceStatus,
  } = useChatRoom()
  return {
    peerOnline,
    myUsername,
    peerUsername,
    currentId,
    peerId,
    roomConnected,
    peerPresenceStatus,
    myPresenceStatus,
  }
}
