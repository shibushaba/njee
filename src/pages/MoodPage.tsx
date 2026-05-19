import { NjeCard } from '../components/ui/NjeCard'
import { PageHeader } from '../components/ui/PageHeader'

export function MoodPage() {
  return (
    <div>
      <PageHeader title="Mood" description="A light check-in with yourself." />
      <NjeCard tone="mint" padding="lg">
        <p className="text-base text-nje-muted">No check-ins logged.</p>
        <p className="mt-stack-lg text-base leading-relaxed text-nje-border/90 sm:text-lg">
          Short notes about how the day feels will collect here over time.
        </p>
      </NjeCard>
    </div>
  )
}
