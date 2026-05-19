/**
 * Google Drive client configuration (browser-safe only).
 * Client secret must never ship in the SPA — use a future Supabase Edge Function
 * or other backend if you need server-to-server or offline access.
 */
export const GOOGLE_DRIVE_SCOPES = [
  /** Full Drive scope: reliable for shared folders and uploads from multiple accounts. Narrow in production if you pass Google verification. */
  'https://www.googleapis.com/auth/drive',
] as const

export const GOOGLE_TOKEN_STORAGE_KEY = 'nje_google_drive_token_v1'
export const GOOGLE_TOKEN_EXPIRY_STORAGE_KEY = 'nje_google_drive_token_exp_v1'

export function readGoogleClientId(): string | null {
  const id = import.meta.env.VITE_GOOGLE_CLIENT_ID
  return typeof id === 'string' && id.length > 0 ? id : null
}

export function readDriveRootFolderId(): string | null {
  const id = import.meta.env.VITE_GOOGLE_DRIVE_ROOT_FOLDER_ID
  return typeof id === 'string' && id.length > 0 ? id : null
}

/** Optional Shared Drive (Team Drive) id — pass on API calls with supportsAllDrives. */
export function readSharedDriveId(): string | null {
  const id = import.meta.env.VITE_GOOGLE_SHARED_DRIVE_ID
  return typeof id === 'string' && id.length > 0 ? id : null
}
