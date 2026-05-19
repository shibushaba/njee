/** Stored in `messages.media_url` when the file lives in Google Drive. */
export const GDRIVE_MEDIA_PREFIX = 'gdrive:' as const

export function isGdriveMediaRef(path: string | null | undefined): boolean {
  return typeof path === 'string' && path.startsWith(GDRIVE_MEDIA_PREFIX)
}

export function parseGdriveFileId(path: string): string | null {
  if (!isGdriveMediaRef(path)) return null
  const id = path.slice(GDRIVE_MEDIA_PREFIX.length).trim()
  return id.length > 0 ? id : null
}

/** Works without Google login after file has link-shared reader permission (set on upload). */
export function publicDriveThumbnailUrl(fileId: string, sz = 'w800'): string {
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=${encodeURIComponent(sz)}`
}

export function publicDriveImageViewUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(fileId)}`
}

export function publicDriveVideoEmbedUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview`
}
