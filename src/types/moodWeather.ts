/** Atmospheric “weather” for the two-user emotional space — subtle, not literal weather. */
export const MOOD_WEATHER_IDS = [
  'calm_rain',
  'warm_sunlight',
  'quiet_midnight',
  'sleepy_atmosphere',
  'study_ambience',
  'soft_cloudy',
  'streak_warmth',
  'nostalgic_haze',
] as const

export type MoodWeatherId = (typeof MOOD_WEATHER_IDS)[number]

export type MoodWeatherParticleKind = 'none' | 'rain' | 'dust' | 'ember'

export type MoodWeatherSignals = {
  /** Local hour 0–23 */
  hour: number
  pathname: string
  /** Either user manually set studying */
  myPresence: string | null
  peerPresence: string | null
  peerOnline: boolean
  peerTyping: boolean
  /** Composer has focus (chat / memories) — soft proxy for “you’re in the thread”. */
  composerFocused: boolean
  /** Shared streak count when chat context exists */
  streakCount: number | null
  /** Streak milestone popup is visible (celebration moment) */
  streakMilestoneActive: boolean
  /** Local midnight layer (00:00–handoff) — deepens atmosphere with mood engine */
  midnightLayerActive?: boolean
}

export type MoodWeatherSnapshot = {
  id: MoodWeatherId
  label: string
  description: string
  /** 0–1 scales overlays / motion */
  intensity: number
  particleKind: MoodWeatherParticleKind
  /** Vignette strength 0–1 */
  vignette: number
  /** Soft film / haze 0–1 */
  haze: number
  /** Extra warmth for gradients (0–1) */
  warmth: number
  /** Cool shift (0–1) */
  cool: number
  /** Animation duration scale (>1 = slower) */
  tempoScale: number
}
