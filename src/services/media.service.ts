import { getGoogleDriveAccessTokenFromSession } from '../lib/googleDriveSession'
import { supabase } from '../lib/supabase'
import { driveDeleteFile } from './googleDrive/driveApi'
import {
  isGdriveMediaRef,
  parseGdriveFileId,
  publicDriveImageViewUrl,
  publicDriveThumbnailUrl,
  publicDriveVideoEmbedUrl,
} from '../utils/gdriveMediaUrl'

export const MEDIA_BUCKET = 'media' as const

export type ChatMediaKind = 'image' | 'video'

export function classifyMediaFile(file: File): ChatMediaKind | null {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  return null
}

export type SignedMediaUrlResult = {
  url: string | null
  error: string | null
  /** Present for Google Drive blob URLs — revoke when the URL is no longer shown. */
  revoke?: () => void
  /** Full-screen Drive video uses this embed URL (link-shared file; no Google login). */
  driveVideoEmbedUrl?: string | null
}

export type CreateSignedMediaUrlOptions = {
  expiresIn?: number
  /** Required for `gdrive:` paths when choosing thumbnail vs full download. */
  mediaKind?: 'image' | 'video'
  /** For Drive videos: `false` uses thumbnail in thread; `true` downloads full file (e.g. fullscreen). */
  fullMedia?: boolean
}

/**
 * Signed Supabase Storage URL, or authenticated Google Drive URL / blob URL for `gdrive:<fileId>`.
 * Second argument can be `expiresIn` (number) for storage-only, or an options object.
 */
export async function createSignedMediaUrl(
  path: string | null | undefined,
  expiresInOrOptions?: number | CreateSignedMediaUrlOptions,
): Promise<SignedMediaUrlResult> {
  if (!path) {
    return { url: null, error: null }
  }

  const opts: CreateSignedMediaUrlOptions =
    typeof expiresInOrOptions === 'number' ? { expiresIn: expiresInOrOptions } : (expiresInOrOptions ?? {})

  if (isGdriveMediaRef(path)) {
    const id = parseGdriveFileId(path)
    if (!id) {
      return { url: null, error: 'Invalid Drive file reference.' }
    }

    const fullMedia = opts.fullMedia ?? false
    const mediaKind = opts.mediaKind ?? 'image'

    if (!fullMedia) {
      return { url: publicDriveThumbnailUrl(id), error: null }
    }

    if (mediaKind === 'video') {
      return {
        url: publicDriveThumbnailUrl(id, 'w1280'),
        driveVideoEmbedUrl: publicDriveVideoEmbedUrl(id),
        error: null,
      }
    }

    return { url: publicDriveImageViewUrl(id), error: null }
  }

  const expiresIn = opts.expiresIn ?? 3600
  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrl(path, expiresIn)
  if (error) {
    return { url: null, error: error.message }
  }
  return { url: data?.signedUrl ?? null, error: null }
}

export type RecordMediaViewResult = {
  ok: boolean
  locked?: boolean
  unlimited?: boolean
  current_views?: number
  reason?: string
}

function parseRpcJson(data: unknown): Record<string, unknown> {
  if (data == null) return {}
  if (Array.isArray(data) && data.length > 0) {
    return parseRpcJson(data[0])
  }
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as Record<string, unknown>
    } catch {
      return {}
    }
  }
  if (typeof data === 'object') return data as Record<string, unknown>
  return {}
}

/** JSON / PostgREST may return real booleans or strings; avoid Boolean("false") === true. */
function rpcBool(value: unknown): boolean {
  if (value === true || value === 1) return true
  if (value === false || value === 0 || value === null || value === undefined) return false
  if (typeof value === 'string') {
    const s = value.trim().toLowerCase()
    if (s === 'true' || s === 't' || s === '1') return true
    if (s === 'false' || s === 'f' || s === '0' || s === '') return false
  }
  return Boolean(value)
}

export async function recordMediaView(messageId: string): Promise<RecordMediaViewResult> {
  const { data, error } = await supabase.rpc('record_message_media_view', { p_message_id: messageId })
  if (error) {
    return { ok: false, locked: false, reason: error.message }
  }
  const row = parseRpcJson(data)
  return {
    ok: rpcBool(row.ok),
    locked: rpcBool(row.locked),
    unlimited: rpcBool(row.unlimited),
    current_views: typeof row.current_views === 'number' ? row.current_views : Number(row.current_views) || undefined,
    reason: typeof row.reason === 'string' ? row.reason : undefined,
  }
}

/**
 * Deletes the Drive object (needs a Google session on this device) then clears `media_url` via RPC
 * so limited-view memories stop referencing storage after the last view.
 */
export async function purgeDriveMemoryAfterLock(
  driveFileId: string,
  messageId: string,
): Promise<{ cleared: boolean; error?: string }> {
  const token = getGoogleDriveAccessTokenFromSession()
  if (!token) {
    return { cleared: false, error: 'no_google_session' }
  }
  const del = await driveDeleteFile(token, driveFileId)
  if (del.error) {
    return { cleared: false, error: del.error }
  }
  const { data, error } = await supabase.rpc('clear_locked_media_path', { p_message_id: messageId })
  if (error) {
    return { cleared: false, error: error.message }
  }
  const row = parseRpcJson(data)
  return { cleared: rpcBool(row.ok) }
}
