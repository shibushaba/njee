import { NavLink } from 'react-router-dom'
import { PresenceStatusCard } from '../components/presence/PresenceStatusCard'
import { MilestonePopup } from '../components/streak/MilestonePopup'
import { StreakCard } from '../components/streak/StreakCard'
import { PageHeader } from '../components/ui/PageHeader'
import { useChatRoom } from '../context/chat-room-context'
import { useStreak } from '../hooks/useStreak'

export function RitualPage() {
  const { currentId, peerId } = useChatRoom()
  const peerReady = Boolean(peerId)
  const streak = useStreak(currentId, peerId)

  return (
    <div className="flex flex-col gap-stack-lg pb-stack-lg">
      <PageHeader
        title="Ritual"
        description="A soft counter for the days you both reach out — not a score, a shared rhythm."
      />
      {!peerReady ? (
        <p className="text-sm text-nje-muted">Connect your thread in chat first — the ritual needs both profiles.</p>
      ) : (
        <>
          <StreakCard row={streak.row} loading={streak.loading} className="shadow-[var(--shadow-nje-flat-sm)]" />
          <PresenceStatusCard className="mt-stack-lg" />
        </>
      )}
      <NavLink
        to="/chat"
        className="inline-flex w-fit border-[2px] border-nje-border bg-nje-mint px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-nje-border shadow-[0_2px_0_0_rgba(90,46,30,0.06)]"
      >
        Back to chat
      </NavLink>
      <MilestonePopup tier={streak.milestone} onDismiss={streak.dismissMilestone} />
    </div>
  )
}
