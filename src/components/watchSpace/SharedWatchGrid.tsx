import type { WatchItemRow } from '../../types/watchItem'
import { WatchCard } from './WatchCard'

type SharedWatchGridProps = {
  mineForThem: WatchItemRow[]
  theirsForMe: WatchItemRow[]
  currentUserId: string | null
  peerUsername: string | null
  onSetWatching: (id: string) => Promise<{ error: string | null }>
  onRequestMarkWatched: (id: string) => void
  onRequeue: (id: string) => Promise<{ error: string | null }>
  onDelete: (id: string) => Promise<{ error: string | null }>
}

export function SharedWatchGrid({
  mineForThem,
  theirsForMe,
  currentUserId,
  peerUsername,
  onSetWatching,
  onRequestMarkWatched,
  onRequeue,
  onDelete,
}: SharedWatchGridProps) {
  const peer = peerUsername?.trim() || 'Them'

  return (
    <div className="flex flex-col gap-stack-lg">
      <section className="space-y-2.5">
        <div className="border-b-[2px] border-nje-border pb-2">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-nje-muted">You suggested for {peer}</h2>
          <p className="mt-1 text-xs leading-relaxed text-nje-muted">Films you nudged toward them — they move the status when they are ready.</p>
        </div>
        {mineForThem.length === 0 ? (
          <p className="text-sm text-nje-muted">Nothing here yet. Send something soft.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {mineForThem.map((item) => (
              <WatchCard
                key={item.id}
                item={item}
                currentUserId={currentUserId}
                peerUsername={peerUsername}
                onSetWatching={onSetWatching}
                onRequestMarkWatched={onRequestMarkWatched}
                onRequeue={onRequeue}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2.5">
        <div className="border-b-[2px] border-nje-border pb-2">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-nje-muted">{peer} suggested for you</h2>
          <p className="mt-1 text-xs leading-relaxed text-nje-muted">Their picks land here — tap watching or watched when the credits roll.</p>
        </div>
        {theirsForMe.length === 0 ? (
          <p className="text-sm text-nje-muted">No suggestions yet. The shelf is patient.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {theirsForMe.map((item) => (
              <WatchCard
                key={item.id}
                item={item}
                currentUserId={currentUserId}
                peerUsername={peerUsername}
                onSetWatching={onSetWatching}
                onRequestMarkWatched={onRequestMarkWatched}
                onRequeue={onRequeue}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
