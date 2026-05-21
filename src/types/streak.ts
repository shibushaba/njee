export type DailyStreakRow = {
  user_a: string
  user_b: string
  current_streak: number
  longest_streak: number
  last_completed_date: string | null
  updated_at: string
}

export type StreakMilestone = 7 | 30 | 100 | 365
