import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { NjeCard } from './NjeCard'

type SectionTone = 'surface' | 'pink' | 'mint' | 'yellow'

type SectionCardProps = {
  eyebrow?: string
  title: string
  description?: string
  footer?: ReactNode
  tone?: SectionTone
  to?: string
  className?: string
}

export function SectionCard({
  eyebrow,
  title,
  description,
  footer,
  tone = 'surface',
  to,
  className,
}: SectionCardProps) {
  const body = (
    <NjeCard
      tone={tone}
      padding="none"
      className={cn(
        'shadow-[var(--shadow-nje-flat)] transition-[transform,box-shadow] duration-200 ease-out',
        to && 'motion-safe:active:translate-y-px motion-safe:active:shadow-[var(--shadow-nje-flat-sm)]',
        className,
      )}
    >
      <div className="flex min-h-[5.5rem] flex-col justify-center gap-stack-md px-gutter-md py-stack-lg sm:min-h-[6.25rem] sm:px-gutter-lg sm:py-stack-xl md:min-h-[7rem]">
        {eyebrow ? (
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-nje-whisper sm:text-xs">
            {eyebrow}
          </p>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-xl font-bold leading-snug tracking-tight text-nje-border sm:text-2xl md:text-[1.65rem]">
            {title}
          </h2>
          {description ? (
            <p className="mt-stack-md max-w-prose text-sm leading-relaxed text-nje-muted sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
        {footer ? <div className="mt-stack border-t-[3px] border-nje-border/25 pt-stack-md">{footer}</div> : null}
      </div>
    </NjeCard>
  )

  if (to) {
    return (
      <Link to={to} className="block min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-nje-border focus-visible:ring-offset-2 focus-visible:ring-offset-nje-bg">
        {body}
      </Link>
    )
  }

  return body
}
