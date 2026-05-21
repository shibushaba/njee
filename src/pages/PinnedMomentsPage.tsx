import { NjeCard } from '../components/ui/NjeCard'
import { PageHeader } from '../components/ui/PageHeader'
import { PinnedMomentGrid } from '../components/pinned/PinnedMomentGrid'
import { useChatRoom } from '../context/chat-room-context'
import { usePinnedMoments } from '../hooks/usePinnedMoments'

export function PinnedMomentsPage() {
  const { currentId, peerId, peerUsername, myPresenceStatus } = useChatRoom()
  const { rows, loading, error, unpin } = usePinnedMoments(currentId, peerId, myPresenceStatus)

  const peerReady = Boolean(peerId)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-stack-lg pb-stack-lg">
      <PageHeader
        title="Pinned moments"
        description="A quiet shelf for what mattered — text, photos, and film from your thread. Shared between you two."
      />

      {!peerReady ? (
        <p className="text-sm text-nje-muted">Open chat once both profiles exist — then you can save moments here.</p>
      ) : error ? (
        <NjeCard tone="surface" padding="md" className="shadow-[var(--shadow-nje-flat-sm)]">
          <p className="text-sm font-semibold text-nje-border">Could not load pins</p>
          <p className="mt-1 text-xs text-nje-muted">{error}</p>
        </NjeCard>
      ) : loading && rows.length === 0 ? (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-40 animate-pulse border-[2px] border-nje-border bg-nje-surface/70" aria-hidden />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <NjeCard tone="pink" padding="md" className="shadow-[var(--shadow-nje-flat-sm)]">
          <p className="text-sm font-semibold text-nje-border">Nothing pinned yet</p>
          <p className="mt-1 text-xs leading-relaxed text-nje-muted">
            Long-press a message in chat or memories, then choose <span className="font-semibold">Pin to moments</span>.
            Each message can only be saved once — together, not like a feed.
          </p>
        </NjeCard>
      ) : (
        <PinnedMomentGrid pins={rows} currentUserId={currentId} peerUsername={peerUsername} onUnpin={unpin} />
      )}
    </div>
  )
}
