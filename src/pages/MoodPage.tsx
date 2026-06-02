import { MidnightIndicator } from '../components/midnight/MidnightIndicator'
import { MoodWeatherIndicator } from '../components/moodWeather/MoodWeatherIndicator'
import { NjeCard } from '../components/ui/NjeCard'
import { PageHeader } from '../components/ui/PageHeader'
import { useMoodWeather } from '../hooks/useMoodWeather'
import { useOptionalMidnightLayer } from '../hooks/useMidnightLayer'

export function MoodPage() {
  const { snapshot } = useMoodWeather()
  const midnight = useOptionalMidnightLayer()

  return (
    <div className="flex flex-col gap-stack-lg pb-stack-lg">
      <PageHeader
        title="Mood"
        description="The room’s light shifts with time, presence, and small daily rhythms — never loud, always felt."
      />
      <div className="flex flex-col gap-stack-md">
        <MoodWeatherIndicator
          variant="card"
          moodId={snapshot.id}
          label={snapshot.label}
          description={snapshot.description}
        />
        {midnight?.snapshot.active ? <MidnightIndicator variant="card" phase={midnight.snapshot.phase} /> : null}
      </div>
      <NjeCard tone="mint" padding="lg" className="shadow-[var(--shadow-nje-flat-sm)]">
        <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-nje-whisper">Check-ins</p>
        <p className="mt-2 text-base text-nje-muted">No check-ins logged yet.</p>
        <p className="mt-stack-lg text-base leading-relaxed text-nje-border/90 sm:text-lg">
          Short notes about how the day feels will collect here over time. The atmosphere above already reflects your
          shared space — time of day, when one of you is studying or resting, late threads, and ritual milestones.
          After midnight, the Midnight layer adds a softer, more private light until dawn.
        </p>
      </NjeCard>
    </div>
  )
}
