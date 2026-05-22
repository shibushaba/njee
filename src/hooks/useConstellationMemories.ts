import { useMemo } from 'react'
import type { ConstellationEdge, MemoryEchoItem } from '../types/memoryEcho'
import { layoutConstellation } from '../utils/constellationLayout'

export function useConstellationMemories(items: MemoryEchoItem[], pairKey: string | null) {
  return useMemo(() => {
    if (!pairKey || items.length === 0) {
      return { nodes: [], edges: [] as ConstellationEdge[] }
    }
    return layoutConstellation(items, pairKey)
  }, [items, pairKey])
}
