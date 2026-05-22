import { useMoodWeatherContext } from '../context/mood-weather-context'

/** Resolved atmosphere for the current moment (null only if provider missing). */
export function useMoodWeather() {
  const ctx = useMoodWeatherContext()
  if (!ctx) {
    throw new Error('useMoodWeather must be used within MoodWeatherProvider')
  }
  return ctx
}

/** Safe variant for optional UI (e.g. settings) outside strict trees. */
export function useOptionalMoodWeather() {
  return useMoodWeatherContext()
}
