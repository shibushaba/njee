import { supabase } from '../lib/supabase'
import type { DailyStreakRow } from '../types/streak'
import { orderPairIds } from '../utils/streakUtils'

function normalizeRow(row: Record<string, unknown>): DailyStreakRow {
  return {
    user_a: String(row.user_a),
    user_b: String(row.user_b),
    current_streak: Number(row.current_streak ?? 0),
    longest_streak: Number(row.longest_streak ?? 0),
    last_completed_date: row.last_completed_date != null ? String(row.last_completed_date) : null,
    updated_at: String(row.updated_at ?? ''),
  }
}

export async function fetchDailyStreak(userId: string, peerId: string) {
  const [a, b] = orderPairIds(userId, peerId)
  const { data, error } = await supabase
    .from('daily_streaks')
    .select('*')
    .eq('user_a', a)
    .eq('user_b', b)
    .maybeSingle()

  if (error) return { data: null as DailyStreakRow | null, error }
  if (!data) return { data: null as DailyStreakRow | null, error: null }
  return { data: normalizeRow(data as Record<string, unknown>), error: null }
}

export function subscribeDailyStreak(
  userId: string,
  peerId: string,
  onRow: (row: DailyStreakRow | null) => void,
): () => void {
  const [a, b] = orderPairIds(userId, peerId)
  const topic = `nje-streak:${a}:${b}`
  const channel = supabase
    .channel(topic)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'daily_streaks',
        filter: `user_a=eq.${a}`,
      },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          const oldRow = payload.old as Record<string, unknown> | undefined
          if (oldRow && String(oldRow.user_a) === a && String(oldRow.user_b) === b) {
            onRow(null)
          }
          return
        }
        const row = payload.new as Record<string, unknown> | undefined
        if (!row || String(row.user_b) !== b) return
        onRow(normalizeRow(row))
      },
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
