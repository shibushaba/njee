import { NavLink } from 'react-router-dom'
import { ChangePasswordForm } from '../components/auth/ChangePasswordForm'
import { PageHeader } from '../components/ui/PageHeader'

export function ChangePasswordPage() {
  return (
    <div>
      <PageHeader
        title="Password"
        description="Confirm your current password, then choose a new one."
        action={
          <NavLink
            to="/settings"
            className="inline-block border-[3px] border-nje-border bg-nje-bg px-3 py-2 text-xs font-bold uppercase tracking-wide text-nje-border shadow-[var(--shadow-nje-flat-sm)] transition-shadow hover:shadow-[var(--shadow-nje-flat)]"
          >
            Back
          </NavLink>
        }
      />
      <ChangePasswordForm />
    </div>
  )
}
