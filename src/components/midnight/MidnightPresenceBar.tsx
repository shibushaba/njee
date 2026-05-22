import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { avatarVariantForUsername } from '../../utils/avatarVariant'
import { cn } from '../../lib/cn'
import type { PresenceStatusId } from '../../types/presenceStatus'
import { presenceAmbientClass, presenceRowTone, presenceShowsAmbient } from '../../utils/presenceStatusMeta'
import { Avatar3D } from '../chat/avatars/Avatar3D'
import { OnlineStatus } from '../chat/OnlineStatus'
import { SleepIndicator } from '../presence/SleepIndicator'
import { StatusSelector } from '../presence/StatusSelector'

type MidnightPresenceBarProps = {
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

function midnightLabel(status: PresenceStatusId, typing: boolean): string {
  if (typing) return 'Awake late'
  switch (status) {
    case 'studying':
      return 'Night study'
    case 'sleeping':
      return 'Midnight room'
    case 'away':
      return 'Quiet mode'
    default:
      return 'Still here'
  }
}

export function MidnightPresenceBar({
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
}: MidnightPresenceBarProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const meVariant = avatarVariantForUsername(myUsername)
  const peerVariant = avatarVariantForUsername(peerUsername)

  const peerSignal = presenceShowsAmbient(peerPresenceStatus)
  const mySignal = presenceShowsAmbient(myPresenceStatus)

  const peerTone = peerSignal ? presenceRowTone(peerPresenceStatus) : 'default'
  const myTone = mySignal ? presenceRowTone(myPresenceStatus) : 'default'

  const peerBarTint = useMemo(() => {
    if (peerTone === 'night') return 'from-nje-border/10 via-nje-surface/25 to-nje-bg/30'
    if (peerTone === 'focus') return 'from-nje-surface/30 via-nje-bg/20 to-nje-surface/28'
    return 'from-nje-surface/20 via-nje-bg/18 to-nje-surface/22'
  }, [peerTone])

  const myBarTint = useMemo(() => {
    if (myTone === 'night') return 'from-nje-border/10 via-nje-surface/25 to-nje-bg/30'
    if (myTone === 'focus') return 'from-nje-surface/30 via-nje-bg/20 to-nje-surface/28'
    return 'from-nje-surface/20 via-nje-bg/18 to-nje-surface/22'
  }, [myTone])

  const slowMs = 980

  return (
    <>
      <motion.section
        layout
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'grid shrink-0 grid-cols-2 gap-0 border-b-[2px] border-nje-border/80 bg-nje-surface/90 shadow-[0_2px_0_0_rgba(90,46,30,0.04)] backdrop-blur-[1px]',
          className,
        )}
        aria-label="Midnight presence"
      >
        <div
          className={cn(
            'relative flex flex-col gap-0 border-r-[2px] border-nje-border/70 bg-gradient-to-br px-2 py-2 sm:px-2.5',
            peerBarTint,
          )}
        >
          <div className="flex items-start gap-2">
            <motion.div
              layout
              className={cn(
                'shrink-0 transition-[filter,opacity,transform] ease-out motion-reduce:transition-none',
                peerSignal && presenceAmbientClass(peerPresenceStatus),
              )}
              style={{ transitionDuration: `${slowMs}ms` }}
            >
              <Avatar3D variant={peerVariant} isTyping={peerTyping} size="md" className="rounded-sm opacity-95" />
            </motion.div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold leading-tight text-nje-border/90">
                {peerReady ? displayName(peerUsername, '…') : '—'}
              </p>
              <p className="mt-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-nje-muted">
                {midnightLabel(peerPresenceStatus, peerTyping)}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                <OnlineStatus online={peerReady && peerOnline} />
                {peerSignal ? <SleepIndicator active={peerPresenceStatus === 'sleeping'} distant /> : null}
              </div>
            </div>
          </div>
        </div>

        <div className={cn('relative flex flex-col gap-0 bg-gradient-to-br px-2 py-2 sm:px-2.5', myBarTint)}>
          <div className="flex items-start gap-2">
            <motion.div
              layout
              className={cn(
                'shrink-0 transition-[filter,opacity,transform] ease-out motion-reduce:transition-none',
                mySignal && presenceAmbientClass(myPresenceStatus),
              )}
              style={{ transitionDuration: `${slowMs}ms` }}
            >
              <Avatar3D variant={meVariant} isTyping={myTyping} size="md" className="rounded-sm opacity-95" />
            </motion.div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold leading-tight text-nje-border/90">{displayName(myUsername, '…')}</p>
              <p className="mt-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-nje-muted">
                {midnightLabel(myPresenceStatus, myTyping)}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                <OnlineStatus online={roomConnected && Boolean(myUsername)} />
                {mySignal ? <SleepIndicator active={myPresenceStatus === 'sleeping'} /> : null}
                <button
                  type="button"
                  onClick={() => setSheetOpen(true)}
                  className="rounded-sm border border-nje-border/30 bg-nje-bg/40 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-nje-muted shadow-[0_1px_0_0_rgba(90,46,30,0.03)] transition hover:border-nje-border/45 hover:text-nje-border"
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
