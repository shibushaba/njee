import { useCallback, useId, useRef, useState, type TouchEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useReducedMotion } from 'framer-motion'
import type { ConstellationEdge, ConstellationNode } from '../../types/memoryEcho'
import { cn } from '../../lib/cn'
import { ConstellationCanvas, constellationGlowFilterUrl } from './ConstellationCanvas'
import { MemoryConnectionLines } from './MemoryConnectionLines'
import { MemoryStarNode } from './MemoryStarNode'

type ConstellationMapProps = {
  nodes: ConstellationNode[]
  edges: ConstellationEdge[]
  className?: string
}

export function ConstellationMap({ nodes, edges, className }: ConstellationMapProps) {
  const reduceMotion = useReducedMotion()
  const filterId = useId()
  const glow = constellationGlowFilterUrl(filterId)
  const navigate = useNavigate()

  const [scale, setScale] = useState(1)
  const pinchRef = useRef<{ dist: number } | null>(null)

  const onTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0]!, e.touches[1]!]
      const dx = a.clientX - b.clientX
      const dy = a.clientY - b.clientY
      pinchRef.current = { dist: Math.hypot(dx, dy) }
    }
  }, [])

  const onTouchMove = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 2 || !pinchRef.current) return
    const [a, b] = [e.touches[0]!, e.touches[1]!]
    const dx = a.clientX - b.clientX
    const dy = a.clientY - b.clientY
    const dist = Math.hypot(dx, dy)
    const ratio = dist / pinchRef.current.dist
    pinchRef.current.dist = dist
    setScale((s) => Math.min(2.2, Math.max(0.75, s * (0.55 + ratio * 0.45))))
  }, [])

  const onTouchEnd = useCallback(() => {
    pinchRef.current = null
  }, [])

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <div
        className="origin-center will-change-transform"
        style={{
          transform: `scale(${scale})`,
          transition: reduceMotion ? undefined : 'transform 0.2s ease-out',
        }}
      >
        <ConstellationCanvas filterId={filterId}>
          <MemoryConnectionLines nodes={nodes} edges={edges} />
          <g filter={glow}>
            {nodes.map((n) => (
              <MemoryStarNode key={n.id} node={n} onActivate={(to) => navigate(to)} />
            ))}
          </g>
        </ConstellationCanvas>
      </div>
      <p className="pointer-events-none absolute bottom-2 left-0 right-0 text-center text-[0.58rem] font-bold uppercase tracking-[0.16em] text-nje-muted/80">
        Tap a star · pinch to zoom
      </p>
    </div>
  )
}
