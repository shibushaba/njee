import { useId } from 'react'
import { cn } from '../../lib/cn'

type StreakFlameProps = {
  count: number
  loading?: boolean
  size?: 'sm' | 'md'
  className?: string
}

/** Minimal vector flame + tabular count; grayscale when streak is 0. */
export function StreakFlame({ count, loading, size = 'sm', className }: StreakFlameProps) {
  const uid = useId().replace(/:/g, '')
  const lit = count > 0
  const gradId = `sf-${uid}`

  const box = size === 'sm' ? 'h-11 w-9' : 'h-[4.5rem] w-[3.25rem]'
  const text = size === 'sm' ? 'text-[0.7rem]' : 'text-sm'

  if (loading) {
    return (
      <div
        className={cn(box, 'shrink-0 animate-pulse rounded-sm border-[2px] border-nje-border/35 bg-nje-bg/60', className)}
        aria-hidden
      />
    )
  }

  return (
    <div
      className={cn('relative shrink-0', box, className)}
      aria-label={`Daily ritual, ${count} days`}
    >
      <svg
        viewBox="0 0 40 48"
        className={cn(
          'pointer-events-none h-full w-full',
          lit ? 'motion-safe:animate-nje-flame' : 'motion-safe:animate-nje-flame-dim',
        )}
        fill="none"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradId} x1="20" y1="46" x2="20" y2="4" gradientUnits="userSpaceOnUse">
            {lit ? (
              <>
                <stop stopColor="#b84a18" />
                <stop offset="0.45" stopColor="#e07a28" />
                <stop offset="1" stopColor="#f2c14e" />
              </>
            ) : (
              <>
                <stop stopColor="#7a726c" />
                <stop offset="0.5" stopColor="#9a928a" />
                <stop offset="1" stopColor="#c4bcb4" />
              </>
            )}
          </linearGradient>
        </defs>
        {/* Side lobes — flat retro shapes */}
        <path
          d="M14 46c-6 0-8-5-6-12 1.5-6 4-10 6-12 0 8-2 16-2 20 0 3-1 4-4 4z"
          fill={`url(#${gradId})`}
          opacity={lit ? 0.92 : 0.85}
        />
        <path
          d="M26 46c6 0 8-5 6-12-1.5-6-4-10-6-12 0 8 2 16 2 20 0 3 1 4 4 4z"
          fill={`url(#${gradId})`}
          opacity={lit ? 0.92 : 0.85}
        />
        {/* Center flame */}
        <path
          d="M20 4c-2.5 4-9 12-10 22-.8 8 3.5 14 10 20 6.5-6 10.8-12 10-20-1-10-7.5-18-10-22z"
          fill={`url(#${gradId})`}
          stroke="#5a2e1e"
          strokeWidth="1.25"
          strokeLinejoin="round"
          className={cn(!lit && 'opacity-[0.92]')}
        />
      </svg>
      <span
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-[18%] flex items-center justify-center font-bold tabular-nums leading-none text-nje-border drop-shadow-[0_1px_0_rgba(255,246,232,0.65)]',
          text,
        )}
      >
        {count}
      </span>
    </div>
  )
}
