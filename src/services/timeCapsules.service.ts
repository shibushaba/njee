import { supabase } from '../lib/supabase'
import type { TimeCapsuleRow, TimeCapsuleType } from '../types/timeCapsule'

function isCapsuleType(s: string): s is TimeCapsuleType {
  return s === 'text' || s === 'image' || s === 'video' || s === 'voice'
}

export function normalizeTimeCapsuleRow(raw: Record<string, unknown>): TimeCapsuleRow | null {
  const id = String(raw.id ?? '')
  const pair_key = String(raw.pair_key ?? '')
  const sender_id = String(raw.sender_id ?? '')
  const receiver_id = String(raw.receiver_id ?? '')
  const ct = String(raw.capsule_type ?? 'text')
  if (!id || !pair_key || !sender_id || !receiver_id) return null
  if (!isCapsuleType(ct)) return null

  return {
    id,
    pair_key,
    sender_id,
    receiver_id,
    capsule_title: raw.capsule_title != null ? String(raw.capsule_title) : null,
    content: String(raw.content ?? ''),
    capsule_type: ct,
    media_url: raw.media_url != null ? String(raw.media_url) : null,
    media_type: raw.media_type === 'image' || raw.media_type === 'video' ? raw.media_type : null,
    unlock_at: String(raw.unlock_at ?? ''),
    is_unlocked: Boolean(raw.is_unlocked),
    unlocked_at: raw.unlocked_at != null ? String(raw.unlocked_at) : null,
    created_at: String(raw.created_at ?? ''),
    context_label: raw.context_label != null ? String(raw.context_label) : null,
  }
}

export async function fetchTimeCapsules(pairKey: string) {
  const { data, error } = await supabase
    .from('time_capsules')
    .select('*')
    .eq('pair_key', pairKey)
    .order('unlock_at', { ascending: false })

  if (error) return { data: [] as TimeCapsuleRow[], error: error.message }
  const rows = (data ?? [])
    .map((r) => normalizeTimeCapsuleRow(r as Record<string, unknown>))
    .filter((r): r is TimeCapsuleRow => Boolean(r))
  return { data: rows, error: null as string | null }
}

export async function insertTimeCapsule(opts: {
  pairKey: string
  senderId: string
  receiverId: string
  capsuleTitle?: string | null
  content: string
  capsuleType: TimeCapsuleType
  mediaUrl?: string | null
  mediaType?: 'image' | 'video' | null
  unlockAtIso: string
  contextLabel?: string | null
}) {
  const { data, error } = await supabase
    .from('time_capsules')
    .insert({
      pair_key: opts.pairKey,
      sender_id: opts.senderId,
      receiver_id: opts.receiverId,
      capsule_title: opts.capsuleTitle?.trim() ? opts.capsuleTitle.trim() : null,
      content: opts.content.trim(),
      capsule_type: opts.capsuleType,
      media_url: opts.mediaUrl?.trim() ? opts.mediaUrl.trim() : null,
      media_type: opts.mediaType ?? null,
      unlock_at: opts.unlockAtIso,
      context_label: opts.contextLabel ?? null,
    })
    .select('*')
    .single()

  if (error) return { data: null as TimeCapsuleRow | null, error: error.message }
  const row = data ? normalizeTimeCapsuleRow(data as Record<string, unknown>) : null
  return { data: row, error: null as string | null }
}

export async function deleteTimeCapsule(capsuleId: string) {
  const { error } = await supabase.from('time_capsules').delete().eq('id', capsuleId)
  return { error: error?.message ?? null }
}

/** Mark due rows unlocked (idempotent). Call from clients on a gentle interval + after fetch. */
export async function syncDueCapsuleUnlocks(pairKey: string) {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('time_capsules')
    .update({ is_unlocked: true, unlocked_at: now })
    .eq('pair_key', pairKey)
    .eq('is_unlocked', false)
    .lte('unlock_at', now)
    .select('id')

  if (error) return { unlockedIds: [] as string[], error: error.message }
  const ids = (data ?? []).map((r) => String((r as { id?: string }).id ?? '')).filter(Boolean)
  return { unlockedIds: ids, error: null as string | null }
}

export function subscribeTimeCapsules(pairKey: string, onChange: () => void): { unsubscribe: () => void } {
  const channel = supabase
    .channel(`nje-capsules:${pairKey}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'time_capsules', filter: `pair_key=eq.${pairKey}` },
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
