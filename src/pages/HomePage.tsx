import { HOME_SECTIONS } from '../config/homeSections'
import { NjeCard } from '../components/ui/NjeCard'
import { SectionCard } from '../components/ui/SectionCard'

export function HomePage() {
  return (
    <div className="flex flex-col gap-stack-xl pb-stack sm:gap-stack-xl md:gap-stack-xl">
      <header className="border-b-[3px] border-nje-border pb-stack-lg sm:pb-stack-xl">
        <p className="text-[0.65rem] font-bold uppercase tracking-[0.28em] text-nje-whisper">
          Private
        </p>
        <h1 className="mt-stack-md text-[2.35rem] font-bold leading-none tracking-tight text-nje-border sm:text-5xl md:text-[3.25rem]">
          nje
        </h1>
        <p className="mt-stack-lg max-w-[34ch] text-base leading-relaxed text-nje-muted sm:max-w-prose sm:text-lg">
          ellathum njenjenje — a soft room for words that do not need to perform.
        </p>
      </header>

      <section aria-labelledby="home-spaces" className="flex flex-col gap-stack-md sm:gap-stack-lg">
        <h2 id="home-spaces" className="sr-only">
          Spaces
        </h2>
        {HOME_SECTIONS.map((section) => (
          <SectionCard key={section.to} {...section} />
        ))}
      </section>

      <NjeCard tone="pink" padding="lg" className="shadow-[var(--shadow-nje-flat)]">
        <p className="text-base leading-relaxed text-nje-border/90 sm:text-lg">
          Nothing here shouts. Everything stays close enough to touch — sharp edges, flat
          color, and room to breathe.
        </p>
      </NjeCard>
    </div>
  )
}
