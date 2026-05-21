import { Lock, LockOpen } from 'lucide-react'
import { cn } from '../../lib/cn'
import { CapsuleCountdown } from './CapsuleCountdown'

type LockedCapsulePreviewProps = {
  title: string | null
  unlockAtIso: string
  isUnlocked: boolean
  senderLabel: string
  className?: string
}

export function LockedCapsulePreview({
  title,
  unlockAtIso,
  isUnlocked,
  senderLabel,
  className,
}: LockedCapsulePreviewProps) {
  const displayTitle = title?.trim() || 'Sealed whisper'

  return (
    <div
      className={cn(
        'relative overflow-hidden border-[2px] border-nje-border bg-nje-bg/90 p-3 shadow-[inset_0_0_0_1px_rgba(242,193,78,0.25)]',
        !isUnlocked && 'shadow-[0_0_24px_rgba(242,193,78,0.12),var(--shadow-nje-flat-sm)]',
        className,
      )}
    >
      {!isUnlocked ? (
        <div
          className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-nje-yellow/25 blur-2xl"
          aria-hidden
        />
      ) : null}
      <div className="relative flex items-start gap-2.5">
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center border-[2px] border-nje-border bg-nje-surface',
            !isUnlocked && 'text-nje-border opacity-95',
          )}
          aria-hidden
        >
          {isUnlocked ? (
            <LockOpen className="size-4 text-nje-mint" strokeWidth={2.25} />
          ) : (
            <Lock className="size-4" strokeWidth={2.25} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-nje-whisper">From {senderLabel}</p>
          <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-nje-border">{displayTitle}</p>
          <div className="mt-2">
            <CapsuleCountdown unlockAtIso={unlockAtIso} isUnlocked={isUnlocked} />
          </div>
        </div>
      </div>
    </div>
  )
}
