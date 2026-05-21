export type WatchPortalStatus = 'suggested' | 'watching' | 'watched'
export type WatchSourceType = 'youtube' | 'link' | 'title'

export type WatchItemRow = {
  id: string
  pair_key: string
  /** Who suggested the title (shibu or finu). */
  added_by: string
  /** Who the suggestion is for. */
  recipient_id: string
  url: string
  title: string
  /** Short note from the suggester when creating. */
  notes: string | null
  status: WatchPortalStatus
  source_type: WatchSourceType
  context_label: string | null
  suggest_stars: number
  /** 1 = highest priority, 3 = lowest. */
  priority: number
  /** After watching — short “abi” (review). */
  abi: string | null
  /** Stars after watching (1–5). */
  stars_watch: number | null
  watched_at: string | null
  created_at: string
  updated_at: string
}
