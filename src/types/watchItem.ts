export type WatchStatus = 'watch_later' | 'watching' | 'favorite'
export type WatchSourceType = 'youtube' | 'link' | 'title'

export type WatchItemRow = {
  id: string
  pair_key: string
  added_by: string
  url: string
  title: string
  notes: string | null
  status: WatchStatus
  source_type: WatchSourceType
  context_label: string | null
  created_at: string
  updated_at: string
}
