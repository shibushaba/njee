import { Image as ImageIcon, Mic, Video } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'
import type { MediaPillRing } from '../../utils/mediaViewPill'

type MediaViewPillProps = {
  kind: 'image' | 'video' | 'voice'
  kindLabel: string
  badge: string
  ring?: MediaPillRing
  opening?: boolean
  exhausted?: boolean
  className?: string
}

function KindIcon({ kind }: { kind: 'image' | 'video' | 'voice' }) {
  const cls = 'size-4 shrink-0 text-nje-border'
  if (kind === 'video') return <Video className={cls} strokeWidth={2.25} aria-hidden />
  if (kind === 'voice') return <Mic className={cls} strokeWidth={2.25} aria-hidden />
  return <ImageIcon className={cls} strokeWidth={2.25} aria-hidden />
}

function BadgeRing({ ring, badge }: { ring: MediaPillRing; badge: string }) {
  if (ring === 'none' && badge.length > 4) {
    return (
      <span className="shrink-0 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-nje-border/75">
        {badge}
      </span>
    )
  }

  const r = 11
  const c = 2 * Math.PI * r
  const dash = ring === 'half' ? c * 0.5 : ring === 'full' ? c * 0.92 : 0

  return (
    <span className="relative flex size-[1.65rem] shrink-0 items-center justify-center text-nje-border">
      {ring !== 'none' ? (
        <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 28 28" aria-hidden>
          <circle
            cx="14"
            cy="14"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.22}
            strokeWidth="2.5"
          />
          <circle
            cx="14"
            cy="14"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
          />
        </svg>
      ) : null}
      <span className="relative text-[0.7rem] font-bold leading-none tabular-nums">{badge}</span>
    </span>
  )
}

export function MediaViewPill({
  kind,
  kindLabel,
  badge,
  ring = 'none',
  opening,
  exhausted,
  className,
}: MediaViewPillProps) {
  const opened = exhausted || badge === 'opened'

  return (
    <div
      className={cn(
        'flex min-h-[3.25rem] w-full items-center justify-center px-3 py-3',
        className,
      )}
    >
      <motion.div
        layout
        className={cn(
          'inline-flex max-w-full items-center gap-2.5 rounded-full border-[2px] px-3.5 py-2',
          'shadow-[0_2px_0_0_rgba(90,46,30,0.06)] transition-[background-color,border-color] duration-200',
          opened
            ? 'border-nje-border/45 bg-nje-surface/90 text-nje-muted'
            : 'border-nje-border bg-nje-mint text-nje-border',
          opening && 'opacity-75',
        )}
        animate={opening ? { opacity: [0.65, 1, 0.65] } : undefined}
        transition={opening ? { repeat: Number.POSITIVE_INFINITY, duration: 1 } : undefined}
      >
        <KindIcon kind={kind} />
        <span
          className={cn(
            'truncate text-[0.88rem] font-bold leading-tight',
            opened ? 'text-nje-muted' : 'text-nje-border',
          )}
        >
          {kindLabel}
        </span>
        <BadgeRing ring={opened ? 'none' : ring} badge={badge} />
      </motion.div>
    </div>
  )
}
