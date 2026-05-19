import type { AvatarVariant } from '../components/chat/avatars/Avatar3D'

export function avatarVariantForUsername(username: string | null): AvatarVariant {
  const u = username?.trim().toLowerCase()
  if (u === 'shibu') return 'shibu'
  return 'finu'
}
