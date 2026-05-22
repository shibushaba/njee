import { Cloud, CloudRain, Flame, Moon, Sparkles, Sun, BookOpen, Heart } from 'lucide-react'
import type { MoodWeatherId } from '../../types/moodWeather'
import { cn } from '../../lib/cn'

const ICONS: Record<MoodWeatherId, typeof Cloud> = {
  calm_rain: CloudRain,
  warm_sunlight: Sun,
  quiet_midnight: Moon,
  sleepy_atmosphere: Moon,
  study_ambience: BookOpen,
  soft_cloudy: Cloud,
  streak_warmth: Flame,
  nostalgic_haze: Sparkles,
}

type MoodWeatherIndicatorProps = {
  label: string
  moodId: MoodWeatherId
  description?: string
  className?: string
  /** Larger treatment on Mood page */
  variant?: 'compact' | 'card'
}

export function MoodWeatherIndicator({ label, moodId, description, className, variant = 'compact' }: MoodWeatherIndicatorProps) {
  const Icon = ICONS[moodId] ?? Cloud

  if (variant === 'card') {
    return (
      <div
        className={cn(
          'flex gap-3 border-[2px] border-nje-border bg-nje-surface/90 px-4 py-3 shadow-[0_2px_0_0_rgba(90,46,30,0.06)]',
          className,
        )}
      >
        <span className="flex size-11 shrink-0 items-center justify-center border-[2px] border-nje-border bg-nje-bg text-nje-border">
          <Icon className="size-5" strokeWidth={2.25} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-nje-whisper">Room atmosphere</p>
          <p className="mt-0.5 text-sm font-bold text-nje-border">{label}</p>
          {description ? <p className="mt-1 text-xs leading-relaxed text-nje-muted">{description}</p> : null}
        </div>
        <Heart className="mt-1 size-4 shrink-0 text-nje-pink opacity-80" strokeWidth={2} aria-hidden />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'inline-flex max-w-full items-center gap-2 border-[2px] border-nje-border bg-nje-surface/95 px-2.5 py-1.5 shadow-[0_2px_0_0_rgba(90,46,30,0.05)]',
        className,
      )}
      title={description}
    >
      <Icon className="size-3.5 shrink-0 text-nje-border" strokeWidth={2.25} aria-hidden />
      <span className="truncate text-[0.62rem] font-bold uppercase tracking-[0.14em] text-nje-border">{label}</span>
    </div>
  )
}
