import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { cn } from '../../lib/cn'

function formatRemaining(ms: number): string {
  if (ms <= 0) return 'Opening…'
  const sec = Math.floor(ms / 1000)
  const min = Math.floor(sec / 60)
  const hr = Math.floor(min / 60)
  const day = Math.floor(hr / 24)
  if (day >= 4) return `${day} days`
  if (day >= 1) return `${day}d ${hr % 24}h`
  if (hr >= 1) return `${hr}h ${min % 60}m`
  if (min >= 1) return `${min} min`
  return 'A breath or two'
}

type CapsuleCountdownProps = {
  unlockAtIso: string
  isUnlocked: boolean
  className?: string
}

/** Calm, coarse ticking — no frantic per-second UI unless the moment is very near. */
export function CapsuleCountdown({ unlockAtIso, isUnlocked, className }: CapsuleCountdownProps) {
  const reduceMotion = useReducedMotion()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (isUnlocked) return
    const target = new Date(unlockAtIso).getTime()
    const tick = () => setNow(Date.now())
    const msLeft = target - Date.now()
    const intervalMs =
      reduceMotion ? 120_000 : msLeft > 3_600_000 ? 60_000 : msLeft > 120_000 ? 10_000 : 1000
    const id = window.setInterval(tick, intervalMs)
    tick()
    return () => window.clearInterval(id)
  }, [unlockAtIso, isUnlocked, reduceMotion])

  if (isUnlocked) {
    return (
      <p className={cn('text-[10px] font-bold uppercase tracking-[0.16em] text-nje-mint', className)}>Open</p>
    )
  }

  const ms = new Date(unlockAtIso).getTime() - now

  return (
    <p
      className={cn('text-[10px] font-bold uppercase tracking-[0.14em] text-nje-muted', className)}
      aria-live="polite"
    >
      {ms > 0 ? <>Unseals in {formatRemaining(ms)}</> : <>Unsealing…</>}
    </p>
  )
}
