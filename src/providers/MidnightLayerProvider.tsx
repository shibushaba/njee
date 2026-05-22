import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { MidnightLayerContext, type MidnightLayerContextValue } from '../context/midnight-layer-context'
import { resolveMidnightLayer } from '../utils/midnightLayerEngine'

type MidnightLayerProviderProps = {
  children: ReactNode
}

export function MidnightLayerProvider({ children }: MidnightLayerProviderProps) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const snapshot = useMemo(() => resolveMidnightLayer(now), [now])

  useEffect(() => {
    const root = document.documentElement
    if (snapshot.active) {
      root.dataset.midnight = '1'
      root.style.setProperty('--nje-midnight-tempo', String(snapshot.tempoScale))
    } else {
      delete root.dataset.midnight
      root.style.removeProperty('--nje-midnight-tempo')
    }
    return () => {
      delete root.dataset.midnight
      root.style.removeProperty('--nje-midnight-tempo')
    }
  }, [snapshot.active, snapshot.tempoScale])

  const value = useMemo<MidnightLayerContextValue>(() => ({ snapshot }), [snapshot])

  return <MidnightLayerContext.Provider value={value}>{children}</MidnightLayerContext.Provider>
}
