import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type PageHeaderProps = {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'mb-stack-xl flex flex-col gap-stack-md border-b-[3px] border-nje-border pb-stack-lg sm:mb-stack-xl sm:flex-row sm:items-end sm:justify-between sm:pb-stack-xl',
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-3xl font-bold tracking-tight text-nje-border sm:text-4xl md:text-[2.5rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-stack-md max-w-prose text-base leading-relaxed text-nje-muted sm:text-lg">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  )
}
