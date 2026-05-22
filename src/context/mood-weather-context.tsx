import { createContext, useContext } from 'react'
import type { MoodWeatherSnapshot } from '../types/moodWeather'

export type MoodWeatherContextValue = {
  snapshot: MoodWeatherSnapshot
  /** Clock tick for debugging / indicator */
  lastResolvedAt: number
}

export const MoodWeatherContext = createContext<MoodWeatherContextValue | null>(null)

export function useMoodWeatherContext(): MoodWeatherContextValue | null {
  return useContext(MoodWeatherContext)
}
