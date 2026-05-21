import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { avatarVariantForUsername } from '../../utils/avatarVariant'
import { cn } from '../../lib/cn'
import type { PresenceStatusId } from '../../types/presenceStatus'
import { presenceAmbientClass, presenceRowTone, presenceShowsAmbient } from '../../utils/presenceStatusMeta'
import { Avatar3D } from '../chat/avatars/Avatar3D'
import { OnlineStatus } from '../chat/OnlineStatus'
import { PresenceBadge } from './PresenceBadge'
import { SleepIndicator } from './SleepIndicator'
import { StatusSelector } from './StatusSelector'

type AmbientPresenceBarProps = {
  myUsername: string | null
  peerUsername: string | null
  peerOnline: boolean
  roomConnected: boolean
  peerTyping: boolean
  myTyping: boolean
  peerReady: boolean
  myPresenceStatus: PresenceStatusId
  peerPresenceStatus: PresenceStatusId
  setPresenceStatus: (id: PresenceStatusId) => Promise<{ error: string | null }>
  className?: string
}

function displayName(username: string | null, fallback: string) {
  if (username && username.trim()) return username
  return fallback
}

export function AmbientPresenceBar({
  myUsername,
  peerUsername,
  peerOnline,
  roomConnected,
  peerTyping,
  myTyping,
  peerReady,
  myPresenceStatus,
  peerPresenceStatus,
  setPresenceStatus,
  className,
}: AmbientPresenceBarProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const meVariant = avatarVariantForUsername(myUsername)
  const peerVariant = avatarVariantForUsername(peerUsername)

  const peerSignal = presenceShowsAmbient(peerPresenceStatus)
  const mySignal = presenceShowsAmbient(myPresenceStatus)

  const peerTone = peerSignal ? presenceRowTone(peerPresenceStatus) : 'default'
  const myTone = mySignal ? presenceRowTone(myPresenceStatus) : 'default'

  const peerBarTint = useMemo(() => {
    if (peerTone === 'night') return 'from-nje-bg/20 via-nje-surface/30 to-nje-bg/25'
    if (peerTone === 'focus') return 'from-nje-surface/40 via-nje-bg/25 to-nje-surface/35'
    return 'from-nje-surface/25 via-nje-bg/15 to-nje-surface/30'
  }, [peerTone])

  const myBarTint = useMemo(() => {
    if (myTone === 'night') return 'from-nje-bg/20 via-nje-surface/30 to-nje-bg/25'
    if (myTone === 'focus') return 'from-nje-surface/40 via-nje-bg/25 to-nje-surface/35'
    return 'from-nje-surface/25 via-nje-bg/15 to-nje-surface/30'
  }, [myTone])

  return (
    <>
      <motion.section
        layout
        className={cn(
          'grid shrink-0 grid-cols-2 gap-0 border-b-[2px] border-nje-border bg-nje-surface shadow-[0_2px_0_0_rgba(90,46,30,0.05)]',
          className,
        )}
        aria-label="Ambient presence"
      >
        <div
          className={cn(
            'relative flex flex-col gap-0 border-r-[2px] border-nje-border bg-gradient-to-br px-2 py-2 sm:px-2.5',
            peerBarTint,
          )}
        >
          <div className="flex items-start gap-2">
            <motion.div
              layout
              className={cn(
                'shrink-0 transition-[filter,opacity,transform] duration-[720ms] ease-out motion-reduce:transition-none',
                peerSignal && presenceAmbientClass(peerPresenceStatus),
                peerSignal && peerPresenceStatus === 'studying' && 'ring-1 ring-nje-border/35 ring-offset-1 ring-offset-nje-surface/0',
              )}
              style={{
                transitionDuration: peerPresenceStatus === 'sleeping' ? '1100ms' : undefined,
              }}
            >
              <Avatar3D variant={peerVariant} isTyping={peerTyping} size="md" className="rounded-sm" />
            </motion.div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold leading-tight text-nje-border">
                {peerReady ? displayName(peerUsername, '…') : '—'}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                <OnlineStatus online={peerReady && peerOnline} />
                {peerSignal ? (
                  <>
                    <PresenceBadge status={peerPresenceStatus} />
                    <SleepIndicator active={peerPresenceStatus === 'sleeping'} distant />
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div
          className={cn(
            'relative flex flex-col gap-0 bg-gradient-to-br px-2 py-2 sm:px-2.5',
            myBarTint,
          )}
        >
          <div className="flex items-start gap-2">
            <motion.div
              layout
              className={cn(
                'shrink-0 transition-[filter,opacity,transform] duration-[720ms] ease-out motion-reduce:transition-none',
                mySignal && presenceAmbientClass(myPresenceStatus),
                mySignal && myPresenceStatus === 'studying' && 'ring-1 ring-nje-border/35 ring-offset-1 ring-offset-nje-surface/0',
              )}
              style={{
                transitionDuration: myPresenceStatus === 'sleeping' ? '1100ms' : undefined,
              }}
            >
              <Avatar3D variant={meVariant} isTyping={myTyping} size="md" className="rounded-sm" />
            </motion.div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold leading-tight text-nje-border">{displayName(myUsername, '…')}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                <OnlineStatus online={roomConnected && Boolean(myUsername)} />
                {mySignal ? (
                  <>
                    <PresenceBadge status={myPresenceStatus} />
                    <SleepIndicator active={myPresenceStatus === 'sleeping'} />
                  </>
                ) : null}
                <button
                  type="button"
                  onClick={() => setSheetOpen(true)}
                  className="rounded-sm border border-nje-border/35 bg-nje-bg/50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-nje-muted shadow-[0_1px_0_0_rgba(90,46,30,0.04)] transition hover:border-nje-border/55 hover:text-nje-border"
                >
                  {mySignal ? 'Edit' : 'Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <StatusSelector
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        value={myPresenceStatus}
        busy={busy}
        onSelect={async (id) => {
          setBusy(true)
          const res = await setPresenceStatus(id)
          setBusy(false)
          if (res.error) window.alert(res.error)
        }}
      />
    </>
  )
}
