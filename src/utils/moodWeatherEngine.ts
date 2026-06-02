import type { MoodWeatherId, MoodWeatherSignals, MoodWeatherSnapshot } from '../types/moodWeather'

function isLateNight(hour: number) {
  return hour >= 23 || hour < 5
}

function isDawn(hour: number) {
  return hour >= 5 && hour < 9
}

function isGoldenEvening(hour: number) {
  return hour >= 16 && hour < 20
}

function isEveningCool(hour: number) {
  return hour >= 19 && hour < 23
}

function studying(s: MoodWeatherSignals) {
  return s.myPresence === 'studying' || s.peerPresence === 'studying'
}

function sleeping(s: MoodWeatherSignals) {
  return s.myPresence === 'sleeping' && s.peerPresence === 'sleeping'
}

function anySleeping(s: MoodWeatherSignals) {
  return s.myPresence === 'sleeping' || s.peerPresence === 'sleeping'
}

function chatActivity(s: MoodWeatherSignals) {
  return s.pathname === '/chat' && (s.peerTyping || s.composerFocused)
}

function baseFromTime(hour: number): MoodWeatherId {
  if (hour >= 23 || hour < 5) return 'quiet_midnight'
  if (isDawn(hour)) return 'warm_sunlight'
  if (isGoldenEvening(hour)) return 'warm_sunlight'
  if (isEveningCool(hour)) return 'calm_rain'
  if (hour >= 9 && hour < 16) return 'soft_cloudy'
  return 'soft_cloudy'
}

/**
 * Resolves one dominant mood + intensities for layers. Tuned for two users: presence and chat rhythm matter.
 */
export function resolveMoodWeather(s: MoodWeatherSignals): MoodWeatherSnapshot {
  let id: MoodWeatherId = baseFromTime(s.hour)
  let intensity = 0.42
  let vignette = 0.12
  let haze = 0.08
  let warmth = 0.35
  let cool = 0.2
  let tempoScale = 1.05
  let particleKind: MoodWeatherSnapshot['particleKind'] = 'dust'

  if (s.streakMilestoneActive) {
    id = 'streak_warmth'
    intensity = 0.72
    vignette = 0.18
    haze = 0.14
    warmth = 0.85
    cool = 0.05
    tempoScale = 0.92
    particleKind = 'ember'
    return finalize(s, id, intensity, vignette, haze, warmth, cool, tempoScale, particleKind)
  }

  if (studying(s)) {
    id = 'study_ambience'
    intensity = 0.38
    vignette = 0.08
    haze = 0.05
    warmth = 0.22
    cool = 0.28
    tempoScale = 1.18
    particleKind = 'none'
    return finalize(s, id, intensity, vignette, haze, warmth, cool, tempoScale, particleKind)
  }

  if (sleeping(s)) {
    id = 'sleepy_atmosphere'
    intensity = 0.48
    vignette = 0.22
    haze = 0.18
    warmth = 0.25
    cool = 0.35
    tempoScale = 1.35
    particleKind = 'dust'
    return finalize(s, id, intensity, vignette, haze, warmth, cool, tempoScale, particleKind)
  }

  if (anySleeping(s)) {
    id = 'soft_cloudy'
    intensity = 0.36
    vignette = 0.14
    haze = 0.12
    warmth = 0.28
    cool = 0.32
    tempoScale = 1.22
    particleKind = 'dust'
    return finalize(s, id, intensity, vignette, haze, warmth, cool, tempoScale, particleKind)
  }

  if (isLateNight(s.hour) && chatActivity(s)) {
    id = 'nostalgic_haze'
    intensity = 0.55
    vignette = 0.26
    haze = 0.22
    warmth = 0.42
    cool = 0.25
    tempoScale = 1.28
    particleKind = 'dust'
    return finalize(s, id, intensity, vignette, haze, warmth, cool, tempoScale, particleKind)
  }

  id = baseFromTime(s.hour)

  switch (id) {
    case 'quiet_midnight':
      intensity = 0.52
      vignette = 0.28
      haze = 0.2
      warmth = 0.18
      cool = 0.45
      tempoScale = 1.32
      particleKind = 'dust'
      if (chatActivity(s)) {
        intensity = 0.58
        haze = 0.26
      }
      break
    case 'warm_sunlight':
      intensity = 0.45
      vignette = 0.1
      haze = 0.06
      warmth = 0.78
      cool = 0.08
      tempoScale = 0.98
      particleKind = 'dust'
      break
    case 'calm_rain':
      intensity = 0.44
      vignette = 0.16
      haze = 0.12
      warmth = 0.22
      cool = 0.48
      tempoScale = 1.12
      particleKind = 'rain'
      break
    default:
      intensity = 0.36
      vignette = 0.11
      haze = 0.09
      warmth = 0.38
      cool = 0.26
      tempoScale = 1.08
      particleKind = 'dust'
  }

  if (s.peerOnline && s.peerTyping && s.pathname === '/chat') {
    intensity = Math.min(0.85, intensity + 0.06)
    tempoScale *= 0.96
  }

  return finalize(s, id, intensity, vignette, haze, warmth, cool, tempoScale, particleKind)
}

function applyMidnightLayerBoost(s: MoodWeatherSignals, snap: MoodWeatherSnapshot): MoodWeatherSnapshot {
  if (!s.midnightLayerActive) return snap
  return {
    ...snap,
    vignette: Math.min(0.92, snap.vignette * 1.12),
    haze: Math.min(0.9, snap.haze * 1.1),
    cool: Math.min(0.95, snap.cool * 1.06),
    warmth: snap.warmth * 0.93,
    tempoScale: snap.tempoScale * 1.08,
    intensity: Math.min(0.92, snap.intensity * 1.04),
  }
}

function finalize(
  s: MoodWeatherSignals,
  id: MoodWeatherId,
  intensity: number,
  vignette: number,
  haze: number,
  warmth: number,
  cool: number,
  tempoScale: number,
  particleKind: MoodWeatherSnapshot['particleKind'],
): MoodWeatherSnapshot {
  const copy = MOOD_COPY[id]
  const snap: MoodWeatherSnapshot = {
    id,
    label: copy.label,
    description: copy.description,
    intensity,
    particleKind,
    vignette,
    haze,
    warmth,
    cool,
    tempoScale,
  }
  return applyMidnightLayerBoost(s, snap)
}

const MOOD_COPY: Record<MoodWeatherId, { label: string; description: string }> = {
  calm_rain: {
    label: 'Calm rain',
    description: 'Cooler, softer edges — a quiet exhale after the day.',
  },
  warm_sunlight: {
    label: 'Warm sunlight',
    description: 'Gentle lift — like morning or golden hour leaning on the window.',
  },
  quiet_midnight: {
    label: 'Quiet midnight',
    description: 'Deep, slow, cinematic stillness for the small hours.',
  },
  sleepy_atmosphere: {
    label: 'Sleepy air',
    description: 'Resting — the room holds its breath.',
  },
  study_ambience: {
    label: 'Study calm',
    description: 'Cleaner focus — fewer sparkles, more room to think.',
  },
  soft_cloudy: {
    label: 'Soft clouds',
    description: 'Neutral cozy — the default hum in the room.',
  },
  streak_warmth: {
    label: 'Streak warmth',
    description: 'Shared ritual glowing — a little extra hearth-light.',
  },
  nostalgic_haze: {
    label: 'Nostalgic haze',
    description: 'Late thread, soft distance — memory-colored light.',
  },
}

/** Soft wash over `#f5d9a6` base — low contrast, mobile-safe. */
export function moodWeatherGradient(s: MoodWeatherSnapshot): string {
  const i = s.intensity
  const w = s.warmth
  const c = s.cool
  const y = 0.06 + 0.1 * w * i
  const m = 0.05 + 0.08 * c * i
  const p = 0.04 + 0.06 * i
  const mint = 0.03 + 0.1 * c * i

  switch (s.id) {
    case 'calm_rain':
      return `linear-gradient(195deg, rgba(90,46,30,${0.05 + 0.08 * i}) 0%, rgba(127,209,185,${mint}) 38%, rgba(245,217,166,${0.55 + 0.15 * i}) 100%)`
    case 'warm_sunlight':
      return `linear-gradient(168deg, rgba(242,193,78,${y}) 0%, rgba(255,246,232,${0.35 * i}) 42%, rgba(245,217,166,${0.5}) 100%)`
    case 'quiet_midnight':
      return `linear-gradient(180deg, rgba(45,24,16,${0.12 + 0.12 * i}) 0%, rgba(90,46,30,${0.08 + 0.06 * i}) 55%, rgba(245,217,166,${0.42 - 0.08 * i}) 100%)`
    case 'sleepy_atmosphere':
      return `linear-gradient(175deg, rgba(90,46,30,${0.07 + 0.06 * i}) 0%, rgba(232,198,200,${p}) 50%, rgba(245,217,166,${0.48}) 100%)`
    case 'study_ambience':
      return `linear-gradient(180deg, rgba(255,246,232,${0.25 * i}) 0%, rgba(245,217,166,${0.52}) 100%)`
    case 'streak_warmth':
      return `linear-gradient(160deg, rgba(242,193,78,${0.12 + 0.2 * i}) 0%, rgba(127,209,185,${0.06 * i}) 45%, rgba(245,217,166,${0.5}) 100%)`
    case 'nostalgic_haze':
      return `linear-gradient(200deg, rgba(90,46,30,${0.08 + 0.1 * i}) 0%, rgba(232,198,200,${0.12 * i}) 40%, rgba(245,217,166,${0.45}) 100%)`
    case 'soft_cloudy':
    default:
      return `linear-gradient(185deg, rgba(255,246,232,${0.2 * i}) 0%, rgba(232,198,200,${m}) 48%, rgba(245,217,166,${0.52}) 100%)`
  }
}
