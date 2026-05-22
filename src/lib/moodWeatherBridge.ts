/** Window event so global mood reacts to streak milestone UI without prop drilling. */
export const NJE_MOOD_STREAK_EVENT = 'nje-streak-milestone' as const

export type NjeMoodStreakDetail = { active: boolean }
