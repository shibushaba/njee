import type { MemoryEchoItem } from '../../types/memoryEcho'
import { cn } from '../../lib/cn'
import { MemoryEchoCard } from './MemoryEchoCard'

type EchoTimelineProps = {
  items: MemoryEchoItem[]
  className?: string
}

export function EchoTimeline({ items, className }: EchoTimelineProps) {
  if (items.length === 0) return null
  return (
    <div className={cn('relative pl-3', className)}>
      <div
        className="pointer-events-none absolute left-[5px] top-2 bottom-2 w-px bg-nje-border/35"
        aria-hidden
      />
      <ol className="flex flex-col gap-4">
        {items.map((item) => (
          <li key={item.id} className="relative pl-5">
            <span
              className="absolute left-0 top-4 size-2.5 rounded-full border-[2px] border-nje-border bg-nje-surface shadow-[0_0_10px_rgba(90,46,30,0.12)]"
              aria-hidden
            />
            <MemoryEchoCard item={item} />
          </li>
        ))}
      </ol>
    </div>
  )
}
