import { getGoogleDriveAccessTokenFromSession } from '../lib/googleDriveSession'
import { supabase } from '../lib/supabase'
import type { ChatMediaKind } from '../types/message'
import { mediaThreadFolder } from '../utils/chatTopic'
import { driveDeleteFile } from './googleDrive/driveApi'
import {
  isGdriveMediaRef,
  parseGdriveFileId,
  publicDriveImageViewUrl,
  publicDriveThumbnailUrl,
  publicDriveVideoEmbedUrl,
} from '../utils/gdriveMediaUrl'

export const MEDIA_BUCKET = 'media' as const

export function classifyMediaFile(file: File): ChatMediaKind | null {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  if (file.type.startsWith('audio/')) return 'voice'
  return null
}

function safeFileExt(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? 'file'
  const dot = base.lastIndexOf('.')
  if (dot <= 0 || dot === base.length - 1) return 'bin'
  const ext = base.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '')
  return ext || 'bin'
}

/** Upload to private Supabase Storage under the thread folder (RLS in migration 002). */
export async function uploadChatMedia(
  file: File,
  senderId: string,
  peerId: string,
): Promise<{ path: string | null; error: string | null }> {
  const folder = mediaThreadFolder(senderId, peerId)
  const path = `${folder}/${crypto.randomUUID()}.${safeFileExt(file.name)}`
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  })
  if (error) return { path: null, error: error.message }
  return { path, error: null }
}

export type SignedMediaUrlResult = {
  url: string | null
  error: string | null
  revoke?: () => void
  driveVideoEmbedUrl?: string | null
}

export type CreateSignedMediaUrlOptions = {
  expiresIn?: number
  mediaKind?: ChatMediaKind
  fullMedia?: boolean
}

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

/** Record an open; if the server treats the row as unlimited but we know it is limited, refetch in the background. */
export async function recordMediaViewWithLimit(
  messageId: string,
  hint: { viewLimit: number | null; currentViews: number },
): Promise<RecordMediaViewResult & { needsRefetch?: boolean }> {
  const limited = hint.viewLimit != null && hint.viewLimit > 0
  const r = await recordMediaView(messageId)
  if (limited && r.unlimited) {
    return { ...r, needsRefetch: true, reason: r.reason ?? 'view_limit_missing_on_server' }
  }
  return r
}

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

/** Delete Storage object (or legacy Drive file) after the single view, then clear DB path. */
export async function purgeLockedMediaAfterLock(
  mediaUrl: string,
  messageId: string,
): Promise<{ cleared: boolean; error?: string }> {
  if (isGdriveMediaRef(mediaUrl)) {
    const fid = parseGdriveFileId(mediaUrl)
    if (!fid) return { cleared: false, error: 'invalid_drive_ref' }
    return purgeDriveMemoryAfterLock(fid, messageId)
  }

  const { error: rmErr } = await supabase.storage.from(MEDIA_BUCKET).remove([mediaUrl])
  if (rmErr) {
    return { cleared: false, error: rmErr.message }
  }

  const { data, error } = await supabase.rpc('clear_locked_media_path', { p_message_id: messageId })
  if (error) {
    return { cleared: false, error: error.message }
  }
  const row = parseRpcJson(data)
  return { cleared: rpcBool(row.ok) }
}
