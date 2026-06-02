import { Image as ImageIcon, Mic, Video } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'

type EphemeralMediaPlaceholderProps = {
  kind: 'image' | 'video' | 'voice'
  opening?: boolean
  viewLimit: number
  opensLeft: number
  className?: string
}

function limitHint(viewLimit: number, opensLeft: number): string {
  if (viewLimit <= 1) {
    return 'One open — then removed from storage.'
  }
  if (opensLeft >= viewLimit) {
    return `Up to ${viewLimit} opens — then removed from storage.`
  }
  return `${opensLeft} open${opensLeft === 1 ? '' : 's'} left — then removed from storage.`
}

export function EphemeralMediaPlaceholder({
  kind,
  opening,
  viewLimit,
  opensLeft,
  className,
}: EphemeralMediaPlaceholderProps) {
  return (
    <div
      className={cn(
        'relative flex min-h-[5.75rem] max-h-[min(36vh,11rem)] w-full flex-col items-center justify-center gap-1.5 bg-gradient-to-b from-nje-surface via-nje-bg to-nje-surface px-3 py-2.5 text-center sm:max-h-[min(38vh,12rem)]',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 30%, rgba(245,217,166,0.35) 0%, transparent 70%)',
        }}
      />
      <motion.span
        layout
        className="relative flex size-9 items-center justify-center border-[2px] border-nje-border bg-nje-bg/90 text-nje-muted shadow-[0_2px_0_0_rgba(90,46,30,0.06)]"
        animate={opening ? { opacity: [0.7, 1, 0.7] } : { opacity: 1 }}
        transition={opening ? { repeat: Number.POSITIVE_INFINITY, duration: 1.1 } : undefined}
      >
        {kind === 'video' ? (
          <Video className="size-4" strokeWidth={2.25} aria-hidden />
        ) : kind === 'voice' ? (
          <Mic className="size-4" strokeWidth={2.25} aria-hidden />
        ) : (
          <ImageIcon className="size-4" strokeWidth={2.25} aria-hidden />
        )}
      </motion.span>
      <p className="relative max-w-[13rem] text-[0.7rem] leading-snug text-nje-muted">
        {opening ? 'Opening…' : 'No preview in chat. Tap to open in full screen.'}
      </p>
      {!opening ? (
        <p className="relative max-w-[13rem] text-[0.62rem] font-semibold leading-snug text-nje-border">
          {limitHint(viewLimit, opensLeft)}
        </p>
      ) : null}
    </div>
  )
}
