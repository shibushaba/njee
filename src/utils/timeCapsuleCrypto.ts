import type { TimeCapsuleType } from '../types/timeCapsule'

/** Prefix for AES-GCM sealed payloads stored in `time_capsules.content`. */
export const TIME_CAPSULE_SEAL_PREFIX = 'nje.v1:'

export type PlainCapsulePayload = {
  capsule_title: string | null
  content: string
  capsule_type: TimeCapsuleType
  media_url: string | null
  media_type: 'image' | 'video' | null
}

function readCapsuleSecret(): string {
  const dedicated = import.meta.env.VITE_TIME_CAPSULE_SECRET?.trim()
  if (dedicated) return dedicated
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
  if (anon) return anon
  return 'nje-capsule-fallback'
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
  return btoa(binary)
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function deriveCapsuleKey(pairKey: string): Promise<CryptoKey> {
  const material = new TextEncoder().encode(`nje-capsule:${pairKey}:${readCapsuleSecret()}`)
  const hash = await crypto.subtle.digest('SHA-256', material)
  return crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

export function isSealedCapsuleContent(content: string): boolean {
  return content.startsWith(TIME_CAPSULE_SEAL_PREFIX)
}

/** True when the row may reveal decrypted payload to participants. */
export function capsuleSealIsOpen(row: { is_unlocked: boolean; unlock_at: string }): boolean {
  if (!row.is_unlocked) return false
  const unlockMs = new Date(row.unlock_at).getTime()
  return !Number.isNaN(unlockMs) && unlockMs <= Date.now()
}

export async function sealCapsulePayload(pairKey: string, payload: PlainCapsulePayload): Promise<string> {
  const key = await deriveCapsuleKey(pairKey)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const plaintext = new TextEncoder().encode(JSON.stringify(payload))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
  const combined = new Uint8Array(iv.length + ciphertext.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), iv.length)
  return `${TIME_CAPSULE_SEAL_PREFIX}${bytesToBase64(combined)}`
}

export async function openCapsulePayload(pairKey: string, sealed: string): Promise<PlainCapsulePayload | null> {
  if (!isSealedCapsuleContent(sealed)) return null
  try {
    const key = await deriveCapsuleKey(pairKey)
    const raw = base64ToBytes(sealed.slice(TIME_CAPSULE_SEAL_PREFIX.length))
    if (raw.length < 13) return null
    const iv = raw.slice(0, 12)
    const data = raw.slice(12)
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
    const parsed = JSON.parse(new TextDecoder().decode(decrypted)) as PlainCapsulePayload
    if (!parsed || typeof parsed !== 'object') return null
    return {
      capsule_title: parsed.capsule_title != null ? String(parsed.capsule_title) : null,
      content: String(parsed.content ?? ''),
      capsule_type:
        parsed.capsule_type === 'image' ||
        parsed.capsule_type === 'video' ||
        parsed.capsule_type === 'voice' ||
        parsed.capsule_type === 'text'
          ? parsed.capsule_type
          : 'text',
      media_url: parsed.media_url != null ? String(parsed.media_url) : null,
      media_type: parsed.media_type === 'image' || parsed.media_type === 'video' ? parsed.media_type : null,
    }
  } catch {
    return null
  }
}
