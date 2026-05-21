import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { NjeCard } from '../components/ui/NjeCard'
import { PageHeader } from '../components/ui/PageHeader'
import { CapsuleComposer, type CapsuleComposerPayload } from '../components/timeCapsule/CapsuleComposer'
import { TimeCapsuleCard } from '../components/timeCapsule/TimeCapsuleCard'
import { useChatRoom } from '../context/chat-room-context'
import { useTimeCapsules } from '../hooks/useTimeCapsules'

export function TimeCapsulesPage() {
  const { currentId, peerId, peerUsername, myPresenceStatus } = useChatRoom()
  const { rows, loading, error, createCapsule, removeCapsule } = useTimeCapsules(currentId, peerId, myPresenceStatus)
  const [composerOpen, setComposerOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [composeErr, setComposeErr] = useState<string | null>(null)

  const peerReady = Boolean(peerId)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-stack-lg pb-stack-lg">
      <PageHeader
        title="Time capsules"
        description="Write to the future of your thread. Nothing opens early — the wait is part of the warmth."
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
        <p className="text-sm text-nje-muted">When your quiet room is ready, you can seal capsules together.</p>
      ) : (
        <button
          type="button"
          onClick={() => {
            setComposeErr(null)
            setComposerOpen(true)
          }}
          className="flex w-full items-center justify-center gap-2 border-[2px] border-nje-border bg-nje-mint py-3 text-xs font-bold uppercase tracking-[0.12em] text-nje-border shadow-[var(--shadow-nje-flat-sm)] transition-transform hover:-translate-y-px motion-safe:active:translate-y-px"
        >
          <Plus className="size-4" strokeWidth={2.5} aria-hidden />
          Seal a capsule
        </button>
      )}

      {error ? (
        <NjeCard tone="surface" padding="md" className="shadow-[var(--shadow-nje-flat-sm)]">
          <p className="text-sm font-semibold text-nje-border">Could not load capsules</p>
          <p className="mt-1 text-xs text-nje-muted">{error}</p>
        </NjeCard>
      ) : loading && rows.length === 0 ? (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-44 animate-pulse border-[2px] border-nje-border bg-nje-surface/70" aria-hidden />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <NjeCard tone="yellow" padding="md" className="shadow-[var(--shadow-nje-flat-sm)]">
          <p className="text-sm font-semibold text-nje-border">No sealed futures yet</p>
          <p className="mt-1 text-xs leading-relaxed text-nje-muted">
            The first capsule can be tiny — a sentence, a photo link, a film still waiting in Drive. Choose an unlock time
            that feels kind, not rushed.
          </p>
        </NjeCard>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {rows.map((c) => (
            <TimeCapsuleCard
              key={c.id}
              capsule={c}
              currentUserId={currentId}
              peerUsername={peerUsername}
              onDelete={removeCapsule}
            />
          ))}
        </div>
      )}

      <CapsuleComposer
        open={composerOpen}
        busy={busy}
        errorText={composeErr}
        onClose={() => {
          if (!busy) setComposerOpen(false)
        }}
        onSubmit={async (payload: CapsuleComposerPayload) => {
          setBusy(true)
          setComposeErr(null)
          const url = payload.mediaUrl?.trim() ?? ''
          const hasMedia = Boolean(url)
          const body = payload.content.trim()
          if (!body && !hasMedia) {
            setComposeErr('Add a few words, a link, or media — capsules like to hold something.')
            setBusy(false)
            return
          }
          if ((payload.capsuleType === 'image' || payload.capsuleType === 'video') && !url) {
            setComposeErr('Paste a media reference for this capsule type.')
            setBusy(false)
            return
          }
          if (payload.capsuleType === 'voice' && !url) {
            setComposeErr('Add a direct audio link for a voice capsule.')
            setBusy(false)
            return
          }
          const unlockMs = new Date(payload.unlockAtIso).getTime()
          if (unlockMs < Date.now() + 60_000) {
            setComposeErr('Choose a time at least a minute from now.')
            setBusy(false)
            return
          }
          const res = await createCapsule({
            content: body,
            capsuleTitle: payload.capsuleTitle,
            capsuleType: payload.capsuleType,
            mediaUrl: hasMedia ? url : null,
            mediaType: payload.mediaType,
            unlockAtIso: payload.unlockAtIso,
          })
          setBusy(false)
          if (res.error) {
            setComposeErr(res.error)
            return
          }
          setComposerOpen(false)
        }}
      />
    </div>
  )
}
