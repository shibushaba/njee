import { NjeCard } from '../ui/NjeCard'
import { cn } from '../../lib/cn'
import { useChatRoom } from '../../context/chat-room-context'
import type { PresenceStatusId } from '../../types/presenceStatus'
import { PRESENCE_WHISPER, presenceShowsAmbient } from '../../utils/presenceStatusMeta'
import { PresenceBadge } from './PresenceBadge'
import { SleepIndicator } from './SleepIndicator'

type PresenceStatusCardProps = {
  className?: string
}

export function PresenceStatusCard({ className }: PresenceStatusCardProps) {
  const { peerId, peerUsername, myUsername, peerPresenceStatus, myPresenceStatus } = useChatRoom()

  const peerReady = Boolean(peerId)

  if (!peerReady) return null

  const showMe = presenceShowsAmbient(myPresenceStatus)
  const showPeer = presenceShowsAmbient(peerPresenceStatus)

  if (!showMe && !showPeer) return null

  const row = (side: 'You' | 'Them', status: PresenceStatusId) => (
    <div className="flex flex-wrap items-center gap-2 border-b border-nje-border/25 py-2 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-nje-muted">{side}</p>
        <p className="mt-1 text-sm font-semibold text-nje-border">
          {side === 'You' ? (myUsername ?? '…') : (peerUsername ?? '…')}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-nje-muted">{PRESENCE_WHISPER[status]}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <PresenceBadge status={status} />
        <SleepIndicator active={status === 'sleeping'} distant={side === 'Them'} />
      </div>
    </div>
  )

  return (
    <NjeCard tone="mint" padding="md" className={cn('shadow-[var(--shadow-nje-flat-sm)]', className)}>
      <p className="text-sm font-bold text-nje-border">Ambient thread</p>
      <p className="mt-1 text-xs leading-relaxed text-nje-muted">
        Something gentle is set — the rest of the time the chat bar is enough.
      </p>
      <div className="mt-3">
        {showMe ? row('You', myPresenceStatus) : null}
        {showPeer ? row('Them', peerPresenceStatus) : null}
      </div>
    </NjeCard>
  )
}
