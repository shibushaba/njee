import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

type AppLayoutProps = {
  children: ReactNode
  className?: string
}

export function AppLayout({ children, className }: AppLayoutProps) {
  return (
    <div
      className={cn(
        'relative flex min-h-dvh w-full flex-col overflow-x-hidden',
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-nje-bg"
        style={{
          backgroundImage: `
            linear-gradient(90deg, rgba(90, 46, 30, 0.06) 1px, transparent 1px),
            linear-gradient(rgba(90, 46, 30, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: '18px 18px',
        }}
      />
      <div className="relative z-0 flex min-h-dvh flex-1 flex-col">{children}</div>
    </div>
  )
}
