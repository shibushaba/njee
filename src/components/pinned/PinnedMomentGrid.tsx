import type { PinnedMomentRow } from '../../types/pinnedMoment'
import { cn } from '../../lib/cn'
import { PinnedMomentCard } from './PinnedMomentCard'

type PinnedMomentGridProps = {
  pins: PinnedMomentRow[]
  currentUserId: string | null
  peerUsername: string | null
  onUnpin: (pinId: string) => Promise<{ error: string | null }>
  className?: string
}

export function PinnedMomentGrid({ pins, currentUserId, peerUsername, onUnpin, className }: PinnedMomentGridProps) {
  return (
    <ul className={cn('grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3', className)}>
      {pins.map((pin) => (
        <li key={pin.id}>
          <PinnedMomentCard pin={pin} currentUserId={currentUserId} peerUsername={peerUsername} onUnpin={onUnpin} />
        </li>
      ))}
    </ul>
  )
}
