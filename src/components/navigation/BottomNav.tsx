import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { TAB_NAV } from './navConfig'

function tabIsActive(path: string, end: boolean | undefined, pathname: string) {
  if (path === '/settings') {
    return pathname === '/settings' || pathname.startsWith('/settings/')
  }
  if (end) {
    return pathname === path
  }
  return pathname === path || pathname.startsWith(`${path}/`)
}

export function BottomNav() {
  const pathname = useLocation().pathname

  return (
    <nav
      className="z-50 shrink-0 border-t-[3px] border-nje-border bg-nje-surface shadow-[0_-4px_0_0_rgba(90,46,30,0.08)]"
      aria-label="Primary"
      style={{
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
      }}
    >
      <div className="mx-auto flex w-full max-w-lg items-stretch justify-between gap-0.5 px-1 pt-2 sm:max-w-2xl sm:gap-1 sm:px-2 md:max-w-3xl lg:max-w-4xl">
        {TAB_NAV.map(({ to, label, icon: Icon, end }) => {
          const active = tabIsActive(to, end, pathname)
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={cn(
                'flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-1 px-0.5 py-1.5 text-[0.58rem] font-bold uppercase leading-tight tracking-wide transition-colors duration-200 sm:min-h-[3.5rem] sm:gap-1.5 sm:px-1 sm:text-[0.62rem]',
                active ? 'text-nje-border' : 'text-nje-muted hover:text-nje-border',
              )}
            >
              <span
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center border-[3px] border-nje-border shadow-[var(--shadow-nje-flat-sm)] transition-[background-color,box-shadow] duration-200 sm:size-11',
                  active ? 'bg-nje-yellow shadow-[var(--shadow-nje-flat)]' : 'bg-nje-bg',
                )}
              >
                <Icon className="size-[1.15rem] stroke-[2.25] sm:size-5" aria-hidden />
              </span>
              <span className="max-w-full truncate text-center">{label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
