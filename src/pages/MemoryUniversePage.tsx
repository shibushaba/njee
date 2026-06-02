import { MidnightIndicator } from '../components/midnight/MidnightIndicator'
import { ConstellationMap } from '../components/memoryUniverse/ConstellationMap'
import { EchoNotification } from '../components/memoryUniverse/EchoNotification'
import { EchoTimeline } from '../components/memoryUniverse/EchoTimeline'
import { MemoryGalaxy } from '../components/memoryUniverse/MemoryGalaxy'
import { MoodWeatherIndicator } from '../components/moodWeather/MoodWeatherIndicator'
import { NjeCard } from '../components/ui/NjeCard'
import { PageHeader } from '../components/ui/PageHeader'
import { useConstellationMemories } from '../hooks/useConstellationMemories'
import { useMemoryEchoes } from '../hooks/useMemoryEchoes'
import { useOptionalMidnightLayer } from '../hooks/useMidnightLayer'
import { useOptionalMoodWeather } from '../hooks/useMoodWeather'

export function MemoryUniversePage() {
  const { echoes, pairKey, loading, errors } = useMemoryEchoes()
  const { nodes, edges } = useConstellationMemories(echoes, pairKey)
  const midnight = useOptionalMidnightLayer()
  const mood = useOptionalMoodWeather()

  const err =
    errors.room || errors.pinned || errors.watch || errors.capsules
      ? [errors.room, errors.pinned, errors.watch, errors.capsules].filter(Boolean).join(' ')
      : null

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-stack-lg pb-stack-lg">
      <PageHeader
        title="Memory universe"
        description="Echoes resurface what mattered; the constellation maps it as a quiet sky — calm, intimate, never noisy."
      />

      {mood ? (
        <MoodWeatherIndicator
          variant="compact"
          moodId={mood.snapshot.id}
          label={mood.snapshot.label}
          description={mood.snapshot.description}
        />
      ) : null}
      {midnight?.snapshot.active ? <MidnightIndicator variant="pill" phase={midnight.snapshot.phase} /> : null}

      {err ? (
        <p className="text-sm text-red-800/90" role="alert">
          {err}
        </p>
      ) : null}

      {loading ? (
        <div className="space-y-2" aria-busy>
          <div className="h-16 animate-pulse border-[2px] border-nje-border bg-nje-surface/80" />
          <div className="h-40 animate-pulse border-[2px] border-nje-border bg-nje-surface/80" />
        </div>
      ) : null}

      {!loading && echoes.length > 0 ? (
        <EchoNotification hint={echoes[0]?.contextLine ?? null} />
      ) : null}

      {!loading && echoes.length === 0 ? (
        <NjeCard tone="surface" padding="md" className="shadow-[var(--shadow-nje-flat-sm)]">
          <p className="text-sm leading-relaxed text-nje-muted">
            When you’ve shared more threads, pins, capsules, and quiet watches, gentle echoes will gather here — never
            on a schedule, always with room to breathe.
          </p>
        </NjeCard>
      ) : null}

      {!loading && echoes.length > 0 ? (
        <NjeCard tone="yellow" padding="sm" className="border-[2px] shadow-[var(--shadow-nje-flat-sm)]">
          <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-nje-muted">Echo timeline</p>
          <EchoTimeline items={echoes} className="mt-3" />
        </NjeCard>
      ) : null}

      {!loading && nodes.length > 0 ? (
        <div>
          <p className="mb-2 text-[0.58rem] font-bold uppercase tracking-[0.18em] text-nje-muted">Constellation</p>
          <MemoryGalaxy midnight={midnight?.snapshot.active} className="min-h-[220px]">
            <ConstellationMap nodes={nodes} edges={edges} className="min-h-[200px]" />
          </MemoryGalaxy>
        </div>
      ) : null}
    </div>
  )
}
