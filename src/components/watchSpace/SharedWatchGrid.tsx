import type { WatchItemRow, WatchStatus } from '../../types/watchItem'
import { WatchCard } from './WatchCard'

type SharedWatchGridProps = {
  items: WatchItemRow[]
  currentUserId: string | null
  peerUsername: string | null
  onSetStatus: (id: string, status: WatchStatus) => Promise<{ error: string | null }>
  onDelete: (id: string) => Promise<{ error: string | null }>
}

export function SharedWatchGrid({ items, currentUserId, peerUsername, onSetStatus, onDelete }: SharedWatchGridProps) {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {items.map((item) => (
        <WatchCard
          key={item.id}
          item={item}
          currentUserId={currentUserId}
          peerUsername={peerUsername}
          onSetStatus={onSetStatus}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
