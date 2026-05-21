import { Link } from 'react-router-dom'
import { Clapperboard, Hourglass } from 'lucide-react'
import { NjeCard } from '../components/ui/NjeCard'
import { PageHeader } from '../components/ui/PageHeader'

export function LoungePage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-stack-lg pb-stack-lg">
      <PageHeader
        title="Lounge"
        description="A corner for futures and films "
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
                <p className="mt-1 text-xs leading-relaxed text-nje-muted">Messages that stay closed until the time you choose.</p>
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
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-nje-muted">Suggestion portal</p>
                <p className="mt-1 text-sm font-semibold leading-snug text-nje-border">mussstt waatchh</p>
                <p className="mt-1 text-xs leading-relaxed text-nje-muted">
                  You suggest for them, they suggest for you — stars, priority, and a little abi after the credits.
                </p>
              </div>
            </div>
          </NjeCard>
        </Link>
      </div>
    </div>
  )
}
