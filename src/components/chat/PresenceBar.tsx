import { motion } from 'framer-motion'
import { avatarVariantForUsername } from '../../utils/avatarVariant'
import { cn } from '../../lib/cn'
import { Avatar3D } from './avatars/Avatar3D'
import { OnlineStatus } from './OnlineStatus'

type PresenceBarProps = {
  myUsername: string | null
  peerUsername: string | null
  peerOnline: boolean
  roomConnected: boolean
  peerTyping: boolean
  myTyping: boolean
  peerReady: boolean
  className?: string
}

function displayName(username: string | null, fallback: string) {
  if (username && username.trim()) return username
  return fallback
}

export function PresenceBar({
  myUsername,
  peerUsername,
  peerOnline,
  roomConnected,
  peerTyping,
  myTyping,
  peerReady,
  className,
}: PresenceBarProps) {
  const meVariant = avatarVariantForUsername(myUsername)
  const peerVariant = avatarVariantForUsername(peerUsername)

  return (
    <motion.section
      layout
      className={cn(
        'grid shrink-0 grid-cols-2 gap-0 border-b-[2px] border-nje-border bg-nje-surface shadow-[0_2px_0_0_rgba(90,46,30,0.05)]',
        className,
      )}
      aria-label="Presence"
    >
      <div className="flex flex-col gap-0 border-r-[2px] border-nje-border px-2 py-2 sm:px-2.5">
        <div className="flex items-start gap-2">
          <Avatar3D variant={meVariant} isTyping={myTyping} size="sm" className="shrink-0 rounded-sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold leading-tight text-nje-border">{displayName(myUsername, '…')}</p>
            <div className="mt-1">
              <OnlineStatus online={roomConnected && Boolean(myUsername)} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-0 px-2 py-2 sm:px-2.5">
        <div className="flex items-start gap-2">
          <Avatar3D variant={peerVariant} isTyping={peerTyping} size="sm" className="shrink-0 rounded-sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold leading-tight text-nje-border">
              {peerReady ? displayName(peerUsername, '…') : '—'}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <OnlineStatus online={peerReady && peerOnline} />
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  )
}
