import { NjeCard } from '../components/ui/NjeCard'
import { PageHeader } from '../components/ui/PageHeader'

export function NotesPage() {
  return (
    <div>
      <PageHeader title="Notes" description="Quick thoughts and lists." />
      <NjeCard tone="surface" padding="none" className="shadow-[var(--shadow-nje-flat)]">
        <label className="block border-b-[3px] border-nje-border px-gutter-md py-stack-md text-[0.65rem] font-bold uppercase tracking-[0.2em] text-nje-whisper sm:px-gutter-lg">
          Scratch pad
        </label>
        <textarea
          className="min-h-[14rem] w-full resize-y bg-transparent px-gutter-md py-stack-lg text-base leading-relaxed text-nje-border outline-none placeholder:text-nje-whisper sm:min-h-[16rem] sm:px-gutter-lg sm:text-lg"
          placeholder="Write something plain and useful…"
          spellCheck={false}
        />
      </NjeCard>
    </div>
  )
}
