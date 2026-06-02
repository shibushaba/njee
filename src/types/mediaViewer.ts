export type FullscreenMediaPayload = {
  kind: 'image' | 'video' | 'voice'
  url: string
  messageId: string
  caption?: string
  /** Legacy Google Drive file id — purge via Drive API when locked. */
  driveFileId?: string | null
  driveVideoEmbedUrl?: string | null
  /** Supabase Storage path (same as message.media_url when not gdrive:). */
  storagePath?: string | null
}
