/** Stable id for shared chat room channel (same string for both participants). */
export function chatRoomTopicId(userA: string, userB: string) {
  return [userA, userB].sort().join(':')
}

/** Filesystem-safe folder name for Storage paths (maps to RLS in `002_media_storage.sql`). */
export function mediaThreadFolder(userA: string, userB: string) {
  return chatRoomTopicId(userA, userB).replace(/:/g, '--')
}
