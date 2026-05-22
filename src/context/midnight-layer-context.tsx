import { createContext, useContext } from 'react'
import type { MidnightLayerSnapshot } from '../types/midnightLayer'

export type MidnightLayerContextValue = {
  snapshot: MidnightLayerSnapshot
}

export const MidnightLayerContext = createContext<MidnightLayerContextValue | null>(null)

export function useMidnightLayerContext(): MidnightLayerContextValue | null {
  return useContext(MidnightLayerContext)
}
