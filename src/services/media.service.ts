import { supabase } from '../lib/supabase'

export const MEDIA_BUCKET = 'media' as const

export type ChatMediaKind = 'image' | 'video'

export function classifyMediaFile(file: File): ChatMediaKind | null {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  return null
}

function extensionForFile(file: File): string {
  const lower = file.name.toLowerCase()
  const i = lower.lastIndexOf('.')
  if (i >= 0) {
    const ext = lower.slice(i + 1, i + 8).replace(/[^a-z0-9]/g, '')
    if (ext.length > 0) return ext
  }
  if (file.type === 'image/jpeg') return 'jpg'
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  if (file.type === 'image/gif') return 'gif'
  if (file.type === 'video/mp4') return 'mp4'
  if (file.type === 'video/webm') return 'webm'
  return 'bin'
}

const MAX_IMAGE = 10 * 1024 * 1024
const MAX_VIDEO = 45 * 1024 * 1024

export async function uploadChatMedia(
  threadFolder: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<{ path: string | null; error: string | null }> {
  const kind = classifyMediaFile(file)
  if (!kind) {
    return { path: null, error: 'Only images or videos are supported.' }
  }
  const max = kind === 'image' ? MAX_IMAGE : MAX_VIDEO
  if (file.size > max) {
    return { path: null, error: kind === 'image' ? 'Image too large (max 10MB).' : 'Video too large (max 45MB).' }
  }

  const objectName = `${crypto.randomUUID()}.${extensionForFile(file)}`
  const path = `${threadFolder}/${objectName}`

  let pct = 0
  const tick = window.setInterval(() => {
    pct = Math.min(88, pct + 5 + Math.random() * 9)
    onProgress?.(Math.round(pct))
  }, 200)

  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  })

  window.clearInterval(tick)

  if (error) {
    onProgress?.(0)
    return { path: null, error: error.message }
  }

  onProgress?.(100)
  return { path, error: null }
}

export async function createSignedMediaUrl(
  path: string,
  expiresIn = 3600,
): Promise<{ url: string | null; error: string | null }> {
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
