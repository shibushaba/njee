/** Local “secret room” hours after midnight until handoff — device timezone. */
export const MIDNIGHT_LAYER_END_HOUR = 5

export type MidnightPhase = 'edge' | 'deep' | 'ease'

export type MidnightLayerSnapshot = {
  /** True from 00:00 local until `MIDNIGHT_LAYER_END_HOUR` (exclusive). */
  active: boolean
  phase: MidnightPhase
  /** Local hour 0–23 */
  hour: number
  /** Multiplier for motion durations (>1 = slower). */
  tempoScale: number
}
