import type { MemoryEchoItem } from '../../types/memoryEcho'
import { cn } from '../../lib/cn'
import { MemoryEchoCard } from './MemoryEchoCard'

type MemoryEchoFeedProps = {
  items: MemoryEchoItem[]
  className?: string
}

export function MemoryEchoFeed({ items, className }: MemoryEchoFeedProps) {
  if (items.length === 0) return null
  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      {items.map((item) => (
        <MemoryEchoCard key={item.id} item={item} />
      ))}
    </div>
  )
}
