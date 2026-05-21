import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { NjeCard } from '../components/ui/NjeCard'
import { PageHeader } from '../components/ui/PageHeader'
import { AddWatchItemModal } from '../components/watchSpace/AddWatchItemModal'
import { SharedWatchGrid } from '../components/watchSpace/SharedWatchGrid'
import { useChatRoom } from '../context/chat-room-context'
import { useWatchSpace } from '../hooks/useWatchSpace'
import type { WatchStatus } from '../types/watchItem'

export function WatchSpacePage() {
  const { currentId, peerId, peerUsername, myPresenceStatus } = useChatRoom()
  const { rows, loading, error, addItem, patchItem, removeItem } = useWatchSpace(currentId, peerId, myPresenceStatus)
  const [modalOpen, setModalOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [modalErr, setModalErr] = useState<string | null>(null)

  const peerReady = Boolean(peerId)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-stack-lg pb-stack-lg">
      <PageHeader
        title="Watch shelf"
        description="A two-person shelf for trailers, films, and late-night rabbit holes — links and titles, kept soft."
        action={
          <Link
            to="/lounge"
            className="inline-block border-[2px] border-nje-border bg-nje-bg px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-nje-border shadow-[0_2px_0_0_rgba(90,46,30,0.08)]"
          >
            Lounge
          </Link>
        }
      />

      {!peerReady ? (
        <p className="text-sm text-nje-muted">When your room is ready, both of you can add to the same shelf.</p>
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
          Add to shelf
        </button>
      )}

      {error ? (
        <NjeCard tone="surface" padding="md" className="shadow-[var(--shadow-nje-flat-sm)]">
          <p className="text-sm font-semibold text-nje-border">Could not load shelf</p>
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
          <p className="text-sm font-semibold text-nje-border">The shelf is empty</p>
          <p className="mt-1 text-xs leading-relaxed text-nje-muted">
            Drop a YouTube link, a streaming URL, or even just a handwritten title. Status can wander from “later” to
            “now” whenever the mood shifts.
          </p>
        </NjeCard>
      ) : (
        <SharedWatchGrid
          items={rows}
          currentUserId={currentId}
          peerUsername={peerUsername}
          onSetStatus={async (id, status: WatchStatus) => patchItem(id, { status })}
          onDelete={removeItem}
        />
      )}

      <AddWatchItemModal
        open={modalOpen}
        busy={busy}
        errorText={modalErr}
        onClose={() => {
          if (!busy) setModalOpen(false)
        }}
        onSubmit={async (payload) => {
          setBusy(true)
          setModalErr(null)
          const res = await addItem({
            url: payload.url,
            title: payload.title,
            notes: payload.notes,
            status: payload.status,
            sourceType: payload.sourceType,
          })
          setBusy(false)
          if (res.error) {
            setModalErr(res.error)
            return
          }
          setModalOpen(false)
        }}
      />
    </div>
  )
}
