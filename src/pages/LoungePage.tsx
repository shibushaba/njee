import { Link } from 'react-router-dom'
import { Clapperboard, Hourglass, FileText } from 'lucide-react'
import { NjeCard } from '../components/ui/NjeCard'
import { PageHeader } from '../components/ui/PageHeader'

export function LoungePage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-stack-lg pb-stack-lg">
      <PageHeader
        title="Lounge"
        description="A slower corner for futures and films — just for the two of you. Nothing here scrolls like a feed."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link to="/lounge/capsules" className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nje-border">
          <NjeCard tone="mint" padding="md" className="h-full shadow-[var(--shadow-nje-flat-sm)] transition-transform group-hover:-translate-y-px">
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center border-[2px] border-nje-border bg-nje-surface shadow-[var(--shadow-nje-flat-sm)]">
                <Hourglass className="size-5 text-nje-border" strokeWidth={2.25} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-nje-muted">Time capsules</p>
                <p className="mt-1 text-sm font-semibold leading-snug text-nje-border">Seal words for later</p>
                <p className="mt-1 text-xs leading-relaxed text-nje-muted">Messages that stay softly closed until the hour you choose.</p>
              </div>
            </div>
          </NjeCard>
        </Link>

        <Link to="/lounge/watch" className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nje-border">
          <NjeCard tone="pink" padding="md" className="h-full shadow-[var(--shadow-nje-flat-sm)] transition-transform group-hover:-translate-y-px">
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center border-[2px] border-nje-border bg-nje-surface shadow-[var(--shadow-nje-flat-sm)]">
                <Clapperboard className="size-5 text-nje-border" strokeWidth={2.25} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-nje-muted">Watch shelf</p>
                <p className="mt-1 text-sm font-semibold leading-snug text-nje-border">Curate what you will press play on</p>
                <p className="mt-1 text-xs leading-relaxed text-nje-muted">YouTube, links, or titles — a shared little shelf, not a streamer.</p>
              </div>
            </div>
          </NjeCard>
        </Link>
      </div>

      <Link
        to="/notes"
        className="inline-flex items-center gap-2 self-start border-[2px] border-nje-border bg-nje-bg px-3 py-2 text-xs font-bold uppercase tracking-wide text-nje-border shadow-[0_2px_0_0_rgba(90,46,30,0.08)] transition-colors hover:bg-nje-surface"
      >
        <FileText className="size-4" strokeWidth={2.25} aria-hidden />
        Quiet notes
      </Link>
    </div>
  )
}
