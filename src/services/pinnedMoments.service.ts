import { supabase } from '../lib/supabase'
import type { PinnedMomentRow } from '../types/pinnedMoment'
import { normalizeMessageRow } from './message.service'

function normalizePinnedRow(raw: Record<string, unknown>): PinnedMomentRow | null {
  const id = String(raw.id ?? '')
  const message_id = String(raw.message_id ?? '')
  const pair_key = String(raw.pair_key ?? '')
  const pinned_by = String(raw.pinned_by ?? '')
  const pinned_at = String(raw.pinned_at ?? '')
  const context_label = raw.context_label != null ? String(raw.context_label) : null

  const nested = raw.messages ?? (raw as { message?: unknown }).message
  const msgRaw = Array.isArray(nested) ? nested[0] : nested
  if (!msgRaw || typeof msgRaw !== 'object') return null
  const message = normalizeMessageRow(msgRaw)
  if (message.deleted_at) return null

  return {
    id,
    message_id,
    pair_key,
    pinned_by,
    pinned_at,
    context_label,
    message,
  }
}

export async function fetchPinnedMoments(pairKey: string) {
  const { data, error } = await supabase
    .from('pinned_moments')
    .select(
      `
      id,
      message_id,
      pair_key,
      pinned_by,
      pinned_at,
      context_label,
      messages!pinned_moments_message_id_fkey (
        id,
        sender_id,
        receiver_id,
        content,
        created_at,
        seen,
        message_type,
        media_url,
        media_type,
        view_limit,
        current_views,
        is_locked,
        deleted_at,
        reply_to_message_id,
        reply_snippet,
        reply_message_type,
        reply_sender_id
      )
    `,
    )
    .eq('pair_key', pairKey)
    .order('pinned_at', { ascending: false })

  if (error) return { data: [] as PinnedMomentRow[], error: error.message }
  const rows = (data ?? [])
    .map((r) => normalizePinnedRow(r as unknown as Record<string, unknown>))
    .filter((r): r is PinnedMomentRow => Boolean(r))
  return { data: rows, error: null }
}

export async function insertPinnedMoment(opts: {
  messageId: string
  pairKey: string
  pinnedBy: string
  contextLabel?: string | null
}) {
  const { error } = await supabase.from('pinned_moments').insert({
    message_id: opts.messageId,
    pair_key: opts.pairKey,
    pinned_by: opts.pinnedBy,
    context_label: opts.contextLabel ?? null,
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'This moment is already in your shared pins.' as const }
    }
    return { error: error.message }
  }
  return { error: null as string | null }
}

export async function deletePinnedMoment(pinId: string) {
  const { error } = await supabase.from('pinned_moments').delete().eq('id', pinId)
  return { error: error?.message ?? null }
}

export function subscribePinnedMoments(
  pairKey: string,
  onChange: () => void,
): { unsubscribe: () => void } {
  const channel = supabase
    .channel(`nje-pinned:${pairKey}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'pinned_moments', filter: `pair_key=eq.${pairKey}` },
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
