import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { NjeCard } from '../components/ui/NjeCard'
import { PageHeader } from '../components/ui/PageHeader'
import { AddWatchItemModal } from '../components/watchSpace/AddWatchItemModal'
import { MarkWatchedModal } from '../components/watchSpace/MarkWatchedModal'
import { SharedWatchGrid } from '../components/watchSpace/SharedWatchGrid'
import { useChatRoom } from '../context/chat-room-context'
import { useWatchSpace } from '../hooks/useWatchSpace'

export function WatchSpacePage() {
  const { currentId, peerId, peerUsername } = useChatRoom()
  const { rows, loading, error, stats, addSuggestion, setStatus, markWatched, removeItem } = useWatchSpace(
    currentId,
    peerId,
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [markId, setMarkId] = useState<string | null>(null)
  const [suggestBusy, setSuggestBusy] = useState(false)
  const [markBusy, setMarkBusy] = useState(false)
  const [modalErr, setModalErr] = useState<string | null>(null)
  const [markErr, setMarkErr] = useState<string | null>(null)

  const peerReady = Boolean(peerId)

  const { mineForThem, theirsForMe } = useMemo(() => {
    if (!currentId || !peerId) return { mineForThem: [] as typeof rows, theirsForMe: [] as typeof rows }
    return {
      mineForThem: rows.filter((r) => r.added_by === currentId && r.recipient_id === peerId),
      theirsForMe: rows.filter((r) => r.added_by === peerId && r.recipient_id === currentId),
    }
  }, [rows, currentId, peerId])

  const markTitle = rows.find((r) => r.id === markId)?.title ?? ''

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-stack-lg pb-stack-lg">
      <PageHeader
        title="Suggestion portal"
        description="A two-way letterbox: you suggest for them, they suggest for you — stars, priority, and quiet abi when the film is done."
        action={
          <Link
            to="/lounge"
            className="inline-block border-[2px] border-nje-border bg-nje-bg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-nje-border shadow-[0_2px_0_0_rgba(90,46,30,0.08)]"
          >
            Lounge
          </Link>
        }
      />

      {peerReady ? (
        <NjeCard tone="yellow" padding="sm" className="shadow-[var(--shadow-nje-flat-sm)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-nje-muted">Finished counts</p>
          <p className="mt-1 text-sm leading-relaxed text-nje-border">
            <span className="font-semibold">{peerUsername?.trim() || 'They'}</span> finished{' '}
            <span className="font-bold">{stats.theyFinishedMine}</span> you suggested · You finished{' '}
            <span className="font-bold">{stats.iFinishedTheirs}</span> from them.
          </p>
        </NjeCard>
      ) : null}

      {!peerReady ? (
        <p className="text-sm text-nje-muted">When your room is ready, you can trade suggestions one-to-one.</p>
      ) : (
        <button
          type="button"
          onClick={() => {
            setModalErr(null)
            setModalOpen(true)
          }}
          className="flex w-full items-center justify-center gap-2 border-[2px] border-nje-border bg-nje-pink py-3 text-xs font-bold uppercase tracking-[0.12em] text-nje-border shadow-[var(--shadow-nje-flat-sm)] transition-transform hover:-translate-y-px motion-safe:active:translate-y-px"
        >
          <Plus className="size-4" strokeWidth={2.5} aria-hidden />
          Suggest a film
        </button>
      )}

      {error ? (
        <NjeCard tone="surface" padding="md" className="shadow-[var(--shadow-nje-flat-sm)]">
          <p className="text-sm font-semibold text-nje-border">Could not load portal</p>
          <p className="mt-1 text-xs text-nje-muted">{error}</p>
        </NjeCard>
      ) : loading && rows.length === 0 ? (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-36 animate-pulse border-[2px] border-nje-border bg-nje-surface/70" aria-hidden />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <NjeCard tone="mint" padding="md" className="shadow-[var(--shadow-nje-flat-sm)]">
          <p className="text-sm font-semibold text-nje-border">The portal is empty</p>
          <p className="mt-1 text-xs leading-relaxed text-nje-muted">
            Suggest something with a title, optional link, stars, and how soon you hope they see it. When they watch,
            they leave an abi and after-watch stars — no spoilers in the queue, only warmth.
          </p>
        </NjeCard>
      ) : (
        <SharedWatchGrid
          mineForThem={mineForThem}
          theirsForMe={theirsForMe}
          currentUserId={currentId}
          peerUsername={peerUsername}
          onSetWatching={async (id) => setStatus(id, 'watching')}
          onRequestMarkWatched={(id) => {
            setMarkErr(null)
            setMarkId(id)
          }}
          onRequeue={async (id) => setStatus(id, 'suggested')}
          onDelete={removeItem}
        />
      )}

      <AddWatchItemModal
        open={modalOpen}
        busy={suggestBusy}
        errorText={modalErr}
        peerUsername={peerUsername}
        onClose={() => {
          if (!suggestBusy) setModalOpen(false)
        }}
        onSubmit={async (payload) => {
          setSuggestBusy(true)
          setModalErr(null)
          const res = await addSuggestion({
            url: payload.url,
            title: payload.title,
            notes: payload.notes,
            sourceType: payload.sourceType,
            suggestStars: payload.suggestStars,
            priority: payload.priority,
          })
          setSuggestBusy(false)
          if (res.error) {
            setModalErr(res.error)
            return
          }
          setModalOpen(false)
        }}
      />

      <MarkWatchedModal
        open={Boolean(markId)}
        title={markTitle}
        busy={markBusy}
        errorText={markErr}
        onClose={() => {
          if (!markBusy) setMarkId(null)
        }}
        onSubmit={async (abi, starsWatch) => {
          if (!markId) return
          setMarkBusy(true)
          setMarkErr(null)
          const res = await markWatched(markId, abi, starsWatch)
          setMarkBusy(false)
          if (res.error) {
            setMarkErr(res.error)
            return
          }
          setMarkId(null)
        }}
      />
    </div>
  )
}
