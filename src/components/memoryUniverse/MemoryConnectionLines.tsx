import type { ConstellationEdge, ConstellationNode } from '../../types/memoryEcho'

type MemoryConnectionLinesProps = {
  nodes: ConstellationNode[]
  edges: ConstellationEdge[]
}

export function MemoryConnectionLines({ nodes, edges }: MemoryConnectionLinesProps) {
  const map = new Map(nodes.map((n) => [n.id, n]))
  return (
    <g aria-hidden>
      {edges.map((e) => {
        const a = map.get(e.from)
        const b = map.get(e.to)
        if (!a || !b) return null
        return (
          <line
            key={`${e.from}-${e.to}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="rgba(245,240,232,0.14)"
            strokeWidth={0.35}
            strokeLinecap="round"
          />
        )
      })}
    </g>
  )
}
