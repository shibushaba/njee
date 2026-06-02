import { supabase } from '../lib/supabase'
import type { TimeCapsuleRow, TimeCapsuleType } from '../types/timeCapsule'
import {
  capsuleSealIsOpen,
  isSealedCapsuleContent,
  openCapsulePayload,
  sealCapsulePayload,
  type PlainCapsulePayload,
} from '../utils/timeCapsuleCrypto'

function isCapsuleType(s: string): s is TimeCapsuleType {
  return s === 'text' || s === 'image' || s === 'video' || s === 'voice'
}

function normalizeTimeCapsuleRowRaw(raw: Record<string, unknown>): TimeCapsuleRow | null {
  const id = String(raw.id ?? '')
  const pair_key = String(raw.pair_key ?? '')
  const sender_id = String(raw.sender_id ?? '')
  const receiver_id = String(raw.receiver_id ?? '')
  const ct = String(raw.capsule_type ?? 'text')
  if (!id || !pair_key || !sender_id || !receiver_id) return null
  if (!isCapsuleType(ct)) return null

  const encryption_version = Number(raw.encryption_version ?? 0)

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
    encryption_version: Number.isFinite(encryption_version) ? encryption_version : 0,
  }
}

/** Strip sensitive fields while sealed; decrypt after the hour passes. */
export async function resolveTimeCapsuleRow(
  raw: Record<string, unknown>,
  pairKey: string,
): Promise<TimeCapsuleRow | null> {
  const base = normalizeTimeCapsuleRowRaw(raw)
  if (!base) return null

  const sealed = base.encryption_version >= 1 || isSealedCapsuleContent(base.content)
  const open = capsuleSealIsOpen(base)

  if (!open) {
    return {
      ...base,
      capsule_title: null,
      content: '',
      media_url: null,
      media_type: null,
      capsule_type: sealed ? 'text' : base.capsule_type,
    }
  }

  if (sealed) {
    const opened = await openCapsulePayload(pairKey, base.content)
    if (!opened) {
      return {
        ...base,
        capsule_title: null,
        content: 'This capsule could not be opened. The seal may have been created on another build.',
        media_url: null,
        media_type: null,
        capsule_type: 'text',
      }
    }
    return {
      ...base,
      capsule_title: opened.capsule_title,
      content: opened.content,
      capsule_type: opened.capsule_type,
      media_url: opened.media_url,
      media_type: opened.media_type,
    }
  }

  return base
}

export function normalizeTimeCapsuleRow(raw: Record<string, unknown>): TimeCapsuleRow | null {
  return normalizeTimeCapsuleRowRaw(raw)
}

function isLegacyPlaintextRow(row: TimeCapsuleRow): boolean {
  if (row.encryption_version >= 1) return false
  if (isSealedCapsuleContent(row.content)) return false
  return Boolean(row.content.trim() || row.capsule_title?.trim() || row.media_url?.trim())
}

/**
 * One-time (idempotent) upgrade: encrypt legacy plaintext rows still visible in Supabase.
 * Runs when either user opens capsules / memory echoes.
 */
export async function resealLegacyCapsulesAtRest(pairKey: string): Promise<{ resealed: number; error: string | null }> {
  const { data, error } = await supabase.from('time_capsules').select('*').eq('pair_key', pairKey)
  if (error) return { resealed: 0, error: error.message }

  let resealed = 0
  for (const raw of data ?? []) {
    const row = normalizeTimeCapsuleRowRaw(raw as Record<string, unknown>)
    if (!row || !isLegacyPlaintextRow(row)) continue

    const payload: PlainCapsulePayload = {
      capsule_title: row.capsule_title,
      content: row.content,
      capsule_type: row.capsule_type,
      media_url: row.media_url,
      media_type: row.media_type,
    }

    if (!payload.content.trim() && !payload.media_url && !payload.capsule_title?.trim()) continue

    try {
      const sealedContent = await sealCapsulePayload(pairKey, payload)
      const { error: updErr } = await supabase
        .from('time_capsules')
        .update({
          content: sealedContent,
          capsule_title: null,
          media_url: null,
          media_type: null,
          capsule_type: 'text',
          encryption_version: 1,
        })
        .eq('id', row.id)

      if (!updErr) resealed += 1
    } catch {
      /* skip row */
    }
  }

  return { resealed, error: null }
}

/** Reseal legacy rows, sync unlock state, return decrypted view for UI. */
export async function prepareTimeCapsules(pairKey: string) {
  const reseal = await resealLegacyCapsulesAtRest(pairKey)
  if (reseal.error) return { data: [] as TimeCapsuleRow[], error: reseal.error, resealed: 0 }
  await syncDueCapsuleUnlocks(pairKey)
  const res = await fetchTimeCapsules(pairKey)
  return { ...res, resealed: reseal.resealed }
}

export async function fetchTimeCapsules(pairKey: string) {
  const { data, error } = await supabase
    .from('time_capsules')
    .select('*')
    .eq('pair_key', pairKey)
    .order('unlock_at', { ascending: false })

  if (error) return { data: [] as TimeCapsuleRow[], error: error.message }
  const rows = (
    await Promise.all((data ?? []).map((r) => resolveTimeCapsuleRow(r as Record<string, unknown>, pairKey)))
  ).filter((r): r is TimeCapsuleRow => Boolean(r))
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
  const payload: PlainCapsulePayload = {
    capsule_title: opts.capsuleTitle?.trim() ? opts.capsuleTitle.trim() : null,
    content: opts.content.trim(),
    capsule_type: opts.capsuleType,
    media_url: opts.mediaUrl?.trim() ? opts.mediaUrl.trim() : null,
    media_type: opts.mediaType ?? null,
  }

  if (!payload.content && !payload.media_url) {
    return { data: null as TimeCapsuleRow | null, error: 'Capsule needs a message or media.' }
  }

  const sealedContent = await sealCapsulePayload(opts.pairKey, payload)

  const { data, error } = await supabase
    .from('time_capsules')
    .insert({
      pair_key: opts.pairKey,
      sender_id: opts.senderId,
      receiver_id: opts.receiverId,
      capsule_title: null,
      content: sealedContent,
      capsule_type: 'text',
      media_url: null,
      media_type: null,
      unlock_at: opts.unlockAtIso,
      context_label: opts.contextLabel ?? null,
      encryption_version: 1,
    })
    .select('*')
    .single()

  if (error) return { data: null as TimeCapsuleRow | null, error: error.message }
  const row = data ? await resolveTimeCapsuleRow(data as Record<string, unknown>, opts.pairKey) : null
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
