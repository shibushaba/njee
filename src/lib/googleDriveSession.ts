import { GOOGLE_TOKEN_EXPIRY_STORAGE_KEY, GOOGLE_TOKEN_STORAGE_KEY } from '../config/googleDrive'

/** Same session keys as `GoogleDriveProvider` (no React required). */
export function getGoogleDriveAccessTokenFromSession(): string | null {
  if (typeof window === 'undefined') return null
  const token = sessionStorage.getItem(GOOGLE_TOKEN_STORAGE_KEY)
  const expRaw = sessionStorage.getItem(GOOGLE_TOKEN_EXPIRY_STORAGE_KEY)
  const expiresAt = expRaw ? Number(expRaw) : null
  if (!token || expiresAt == null || Number.isNaN(expiresAt)) return null
  if (Date.now() > expiresAt - 60_000) {
    sessionStorage.removeItem(GOOGLE_TOKEN_STORAGE_KEY)
    sessionStorage.removeItem(GOOGLE_TOKEN_EXPIRY_STORAGE_KEY)
    return null
  }
  return token
}
