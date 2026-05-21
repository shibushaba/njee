import { supabase } from '../lib/supabase'
import type { PresenceStatusId, ProfilePresenceRow } from '../types/presenceStatus'
import { isPresenceStatusId } from '../types/presenceStatus'

function normalizeRow(row: Record<string, unknown>): ProfilePresenceRow {
  const ps = String(row.presence_status ?? 'active_now')
  return {
    id: String(row.id),
    username: String(row.username ?? ''),
    presence_status: isPresenceStatusId(ps) ? ps : 'active_now',
    presence_updated_at: String(row.presence_updated_at ?? ''),
  }
}

export async function fetchProfilePresence(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, presence_status, presence_updated_at')
    .eq('id', userId)
    .maybeSingle()

  if (error) return { data: null as ProfilePresenceRow | null, error }
  if (!data) return { data: null as ProfilePresenceRow | null, error: null }
  return { data: normalizeRow(data as Record<string, unknown>), error: null }
}

export async function updateMyPresence(userId: string, status: PresenceStatusId) {
  const { error } = await supabase
    .from('profiles')
    .update({
      presence_status: status,
      presence_updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  return { error: error?.message ?? null }
}
