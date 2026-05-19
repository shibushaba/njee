export type FullscreenMediaPayload = {
  kind: 'image' | 'video'
  url: string
  messageId: string
  caption?: string
  /** Google file id when `media_url` is `gdrive:<id>` (used to free Drive quota after last view). */
  driveFileId?: string | null
  /** Drive preview URL for link-shared videos (no Google login required to play). */
  driveVideoEmbedUrl?: string | null
}
