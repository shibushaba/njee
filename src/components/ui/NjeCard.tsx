import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type NjeCardProps = {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  tone?: 'surface' | 'pink' | 'mint' | 'yellow'
} & HTMLAttributes<HTMLDivElement>

const toneClass = {
  surface: 'bg-nje-surface',
  pink: 'bg-nje-pink',
  mint: 'bg-nje-mint',
  yellow: 'bg-nje-yellow',
} as const

const padClass = {
  none: '',
  sm: 'p-4 sm:p-5',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8 md:p-10',
} as const

export function NjeCard({
  children,
  className,
  padding = 'md',
  tone = 'surface',
  ...rest
}: NjeCardProps) {
  return (
    <div
      className={cn(
        'rounded-none border-[3px] border-nje-border shadow-[var(--shadow-nje-flat-sm)] transition-[transform,box-shadow] duration-200 ease-out',
        'hover:shadow-[var(--shadow-nje-flat)] motion-safe:hover:-translate-y-px',
        toneClass[tone],
        padClass[padding],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
