import type { StreakMilestone } from '../types/streak'

export const STREAK_MILESTONES: readonly StreakMilestone[] = [7, 30, 100, 365] as const

/** Canonical pair key for storage (user_a < user_b). */
export function orderPairIds(id1: string, id2: string): [string, string] {
  return id1 < id2 ? [id1, id2] : [id2, id1]
}

export function milestoneStorageKey(userA: string, userB: string): string {
  const [a, b] = orderPairIds(userA, userB)
  return `nje.streak.milestones:${a}:${b}`
}

export function readCelebratedMilestones(userA: string, userB: string): Set<number> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(milestoneStorageKey(userA, userB))
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as unknown
    if (!Array.isArray(arr)) return new Set()
    return new Set(arr.filter((x) => typeof x === 'number'))
  } catch {
    return new Set()
  }
}

export function markMilestoneCelebrated(userA: string, userB: string, tier: StreakMilestone): void {
  if (typeof window === 'undefined') return
  const set = readCelebratedMilestones(userA, userB)
  set.add(tier)
  window.localStorage.setItem(milestoneStorageKey(userA, userB), JSON.stringify([...set]))
}

/** Next milestone threshold strictly after current streak (or null). */
export function nextMilestoneAfter(streak: number): StreakMilestone | null {
  for (const m of STREAK_MILESTONES) {
    if (streak < m) return m
  }
  return null
}

/**
 * When streak increases from `prev` to `next`, return the highest milestone newly
 * crossed that has not yet been celebrated (per localStorage).
 */
export function popUncelebratedMilestone(
  userA: string,
  userB: string,
  prev: number,
  next: number,
): StreakMilestone | null {
  if (next <= prev) return null
  const celebrated = readCelebratedMilestones(userA, userB)
  let hit: StreakMilestone | null = null
  for (const m of STREAK_MILESTONES) {
    if (prev < m && next >= m && !celebrated.has(m)) hit = m
  }
  return hit
}

export function formatStreakDate(isoDate: string | null): string | null {
  if (!isoDate) return null
  const d = new Date(`${isoDate}T12:00:00Z`)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}
