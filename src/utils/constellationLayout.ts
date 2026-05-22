import type { ConstellationEdge, ConstellationNode, MemoryEchoItem } from '../types/memoryEcho'

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

const GOLDEN = 2.39996322972865332

export type ConstellationLayout = {
  nodes: ConstellationNode[]
  edges: ConstellationEdge[]
}

/** Soft spiral galaxy: chronological edges, calm radial spread (viewBox 0–100). */
export function layoutConstellation(items: MemoryEchoItem[], pairKey: string): ConstellationLayout {
  const sorted = [...items]
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
    .slice(0, 14)

  const phase = (hashStr(pairKey) % 360) * (Math.PI / 180) * 0.04

  const nodes: ConstellationNode[] = sorted.map((item, i) => {
    const angle = i * GOLDEN + phase
    const rad = 6 + i * 2.85
    return {
      id: item.id,
      x: 50 + rad * Math.cos(angle) * 0.72,
      y: 50 + rad * Math.sin(angle) * 0.44,
      r: 1.6 + (hashStr(item.id) % 9) / 10,
      label: item.title.length > 28 ? `${item.title.slice(0, 27)}…` : item.title,
      kind: item.kind,
      navigateTo: item.navigateTo,
    }
  })

  const edges: ConstellationEdge[] = []
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({ from: nodes[i]!.id, to: nodes[i + 1]!.id })
  }

  return { nodes, edges }
}
