import type { ReactNode } from 'react'

type ConstellationCanvasProps = {
  children: ReactNode
  filterId: string
}

export function ConstellationCanvas({ children, filterId }: ConstellationCanvasProps) {
  const fid = filterId.replace(/:/g, '')
  return (
    <svg
      viewBox="0 0 100 62"
      className="block w-full max-h-[min(52vh,420px)] min-h-[200px] touch-none select-none"
      preserveAspectRatio="xMidYMid meet"
      aria-label="Shared memory constellation"
    >
      <defs>
        <filter id={`njeConstellationGlow-${fid}`} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="0.65" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {children}
    </svg>
  )
}

export function constellationGlowFilterUrl(filterId: string) {
  return `url(#njeConstellationGlow-${filterId.replace(/:/g, '')})`
}
