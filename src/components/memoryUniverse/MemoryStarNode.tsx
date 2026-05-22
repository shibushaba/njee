import type { ConstellationNode } from '../../types/memoryEcho'
import { echoKindLabel } from '../../utils/buildMemoryEchoes'

type MemoryStarNodeProps = {
  node: ConstellationNode
  onActivate: (to: string) => void
}

export function MemoryStarNode({ node, onActivate }: MemoryStarNodeProps) {
  const label = `${echoKindLabel(node.kind)}. ${node.label}`

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={label}
      className="cursor-pointer outline-none focus-visible:[&_circle]:stroke-[1.2px]"
      onClick={() => onActivate(node.navigateTo)}
      onKeyDown={(ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault()
          onActivate(node.navigateTo)
        }
      }}
    >
      <circle cx={node.x} cy={node.y} r={node.r + 2.2} fill="rgba(255,248,235,0.04)" />
      <circle
        cx={node.x}
        cy={node.y}
        r={node.r}
        fill="rgba(255,248,235,0.88)"
        stroke="rgba(90,46,30,0.35)"
        strokeWidth={0.22}
        className="transition-opacity duration-200 hover:opacity-90"
      />
    </g>
  )
}
