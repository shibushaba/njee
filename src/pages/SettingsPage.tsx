import { NavLink } from 'react-router-dom'
import { LogoutButton } from '../components/auth/LogoutButton'
import { NjeCard } from '../components/ui/NjeCard'
import { PageHeader } from '../components/ui/PageHeader'
import { useNjeProfile } from '../hooks/useNjeProfile'

export function SettingsPage() {
  const { username } = useNjeProfile()

  return (
    <div>
      <PageHeader title="Settings" description="Account and app preferences." />
      <div className="flex flex-col gap-stack-md sm:gap-stack-lg">
        <NjeCard tone="surface" padding="lg" className="shadow-[var(--shadow-nje-flat)]">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-nje-whisper">Signed in as</p>
          <p className="mt-stack-md text-base font-semibold text-nje-border sm:text-lg">
            {username ?? 'Member'}
          </p>
        </NjeCard>
        <NavLink
          to="/settings/password"
          className="block border-[3px] border-nje-border bg-nje-mint px-gutter-md py-stack-lg text-sm font-bold uppercase tracking-wide text-nje-border shadow-[var(--shadow-nje-flat-sm)] transition-[transform,box-shadow] hover:shadow-[var(--shadow-nje-flat)] motion-safe:active:translate-y-px"
        >
          Change password
        </NavLink>
        <NjeCard
          tone="surface"
          padding="lg"
          className="flex flex-col gap-stack-md border-nje-border shadow-[var(--shadow-nje-flat)] sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-lg font-bold text-nje-border">Notifications</p>
            <p className="mt-stack text-sm text-nje-muted">Coming soon</p>
          </div>
          <span className="w-fit border-[3px] border-nje-border bg-nje-bg px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-nje-muted">
            Off
          </span>
        </NjeCard>
        <NjeCard
          tone="surface"
          padding="lg"
          className="flex flex-col gap-stack-md border-nje-border shadow-[var(--shadow-nje-flat)] sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="text-lg font-bold text-nje-border">Theme</p>
            <p className="mt-stack text-sm text-nje-muted">Pastel / flat</p>
          </div>
          <span className="w-fit border-[3px] border-nje-border bg-nje-yellow px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-nje-border">
            Default
          </span>
        </NjeCard>
        <LogoutButton />
      </div>
    </div>
  )
}
