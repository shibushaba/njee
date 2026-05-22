import { MIDNIGHT_LAYER_END_HOUR, type MidnightLayerSnapshot, type MidnightPhase } from '../types/midnightLayer'

export function resolveMidnightLayer(now: Date): MidnightLayerSnapshot {
  const hour = now.getHours()
  const active = hour >= 0 && hour < MIDNIGHT_LAYER_END_HOUR

  let phase: MidnightPhase = 'ease'
  if (active) {
    if (hour === 0) phase = 'edge'
    else if (hour >= 1 && hour <= 3) phase = 'deep'
    else phase = 'ease'
  }

  const tempoScale = active ? (phase === 'deep' ? 1.22 : phase === 'edge' ? 1.12 : 1.08) : 1

  return { active, phase, hour, tempoScale }
}
