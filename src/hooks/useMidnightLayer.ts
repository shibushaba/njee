import { useMidnightLayerContext } from '../context/midnight-layer-context'

export function useMidnightLayer() {
  const ctx = useMidnightLayerContext()
  if (!ctx) {
    throw new Error('useMidnightLayer must be used within MidnightLayerProvider')
  }
  return ctx
}

export function useOptionalMidnightLayer() {
  return useMidnightLayerContext()
}
