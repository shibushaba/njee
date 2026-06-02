export type FullscreenMediaPayload = {
  kind: 'image' | 'video' | 'voice'
  url: string
  messageId: string
  caption?: string
  /** Set for view-once / view-twice so the viewer enforces limits even if the row was stale. */
  viewLimit?: number | null
  currentViews?: number
  /** Legacy Google Drive file id — purge via Drive API when locked. */
  driveFileId?: string | null
  driveVideoEmbedUrl?: string | null
  /** Supabase Storage path (same as message.media_url when not gdrive:). */
  storagePath?: string | null
}
