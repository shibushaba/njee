import { supabase } from '../lib/supabase'
import type { WatchItemRow, WatchSourceType, WatchStatus } from '../types/watchItem'

function isWatchStatus(s: string): s is WatchStatus {
  return s === 'watch_later' || s === 'watching' || s === 'favorite'
}

function isWatchSource(s: string): s is WatchSourceType {
  return s === 'youtube' || s === 'link' || s === 'title'
}

export function normalizeWatchItemRow(raw: Record<string, unknown>): WatchItemRow | null {
  const id = String(raw.id ?? '')
  const pair_key = String(raw.pair_key ?? '')
  const added_by = String(raw.added_by ?? '')
  const st = String(raw.status ?? 'watch_later')
  const src = String(raw.source_type ?? 'link')
  if (!id || !pair_key || !added_by) return null
  if (!isWatchStatus(st) || !isWatchSource(src)) return null

  return {
    id,
    pair_key,
    added_by,
    url: String(raw.url ?? ''),
    title: String(raw.title ?? ''),
    notes: raw.notes != null ? String(raw.notes) : null,
    status: st,
    source_type: src,
    context_label: raw.context_label != null ? String(raw.context_label) : null,
    created_at: String(raw.created_at ?? ''),
    updated_at: String(raw.updated_at ?? ''),
  }
}

export async function fetchWatchItems(pairKey: string) {
  const { data, error } = await supabase
    .from('watch_items')
    .select('*')
    .eq('pair_key', pairKey)
    .order('updated_at', { ascending: false })

  if (error) return { data: [] as WatchItemRow[], error: error.message }
  const rows = (data ?? [])
    .map((r) => normalizeWatchItemRow(r as Record<string, unknown>))
    .filter((r): r is WatchItemRow => Boolean(r))
  return { data: rows, error: null as string | null }
}

export async function insertWatchItem(opts: {
  pairKey: string
  addedBy: string
  url: string
  title: string
  notes?: string | null
  status: WatchStatus
  sourceType: WatchSourceType
  contextLabel?: string | null
}) {
  const { data, error } = await supabase
    .from('watch_items')
    .insert({
      pair_key: opts.pairKey,
      added_by: opts.addedBy,
      url: opts.url.trim(),
      title: opts.title.trim(),
      notes: opts.notes?.trim() ? opts.notes.trim() : null,
      status: opts.status,
      source_type: opts.sourceType,
      context_label: opts.contextLabel ?? null,
    })
    .select('*')
    .single()

  if (error) return { data: null as WatchItemRow | null, error: error.message }
  const row = data ? normalizeWatchItemRow(data as Record<string, unknown>) : null
  return { data: row, error: null as string | null }
}

export async function updateWatchItem(
  id: string,
  patch: Partial<Pick<WatchItemRow, 'title' | 'notes' | 'status' | 'url' | 'source_type'>>,
) {
  const body: Record<string, unknown> = { ...patch, updated_at: new Date().toISOString() }
  const { data, error } = await supabase.from('watch_items').update(body).eq('id', id).select('*').single()

  if (error) return { data: null as WatchItemRow | null, error: error.message }
  const row = data ? normalizeWatchItemRow(data as Record<string, unknown>) : null
  return { data: row, error: null as string | null }
}

export async function deleteWatchItem(id: string) {
  const { error } = await supabase.from('watch_items').delete().eq('id', id)
  return { error: error?.message ?? null }
}

export function subscribeWatchItems(pairKey: string, onChange: () => void): { unsubscribe: () => void } {
  const channel = supabase
    .channel(`nje-watch:${pairKey}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'watch_items', filter: `pair_key=eq.${pairKey}` },
      () => {
        onChange()
      },
    )
    .subscribe()

  return {
    unsubscribe: () => {
      void supabase.removeChannel(channel)
    },
  }
}
