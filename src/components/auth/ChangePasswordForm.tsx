import { motion } from 'framer-motion'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { changePasswordWithVerification } from '../../services/auth.service'
import { cn } from '../../lib/cn'
import { useAuth } from '../../hooks/useAuth'
import { PasswordField } from './PasswordField'
import { usePasswordVisibility } from '../../hooks/usePasswordVisibility'

type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

export function ChangePasswordForm() {
  const { user } = useAuth()
  const email = user?.email ?? ''

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const cur = usePasswordVisibility()
  const neu = usePasswordVisibility()
  const conf = usePasswordVisibility()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErrorMessage(null)

    if (!email) {
      setStatus('error')
      setErrorMessage('No active session.')
      return
    }

    if (newPassword.length < 6) {
      setStatus('error')
      setErrorMessage('New password must be at least 6 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setStatus('error')
      setErrorMessage('New password and confirmation do not match.')
      return
    }

    setStatus('submitting')
    const { error } = await changePasswordWithVerification(email, currentPassword, newPassword)

    if (error) {
      setStatus('error')
      setErrorMessage(error.message || 'Could not update password.')
      return
    }

    setStatus('success')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  return (
    <motion.form
      onSubmit={onSubmit}
      className="flex flex-col gap-stack-lg border-[3px] border-nje-border bg-nje-surface p-gutter-md shadow-[var(--shadow-nje-flat)] sm:p-gutter-lg"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      <PasswordField
        id="nje-current-password"
        name="currentPassword"
        label="Current password"
        value={currentPassword}
        onChange={setCurrentPassword}
        autoComplete="current-password"
        disabled={status === 'submitting'}
        visible={cur.visible}
        onToggleVisible={cur.toggle}
      />

      <PasswordField
        id="nje-new-password"
        name="newPassword"
        label="New password"
        value={newPassword}
        onChange={setNewPassword}
        autoComplete="new-password"
        disabled={status === 'submitting'}
        visible={neu.visible}
        onToggleVisible={neu.toggle}
      />

      <PasswordField
        id="nje-confirm-password"
        name="confirmPassword"
        label="Confirm new password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        autoComplete="new-password"
        disabled={status === 'submitting'}
        visible={conf.visible}
        onToggleVisible={conf.toggle}
      />

      {errorMessage ? (
        <p className="text-sm font-medium text-nje-border" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {status === 'success' ? (
        <p className="border-t-[3px] border-nje-border/30 pt-stack-md text-sm font-medium text-nje-muted">
          Password updated. You stay signed in on this device.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className={cn(
          'w-full border-[3px] border-nje-border bg-nje-yellow px-4 py-3.5 text-sm font-bold uppercase tracking-wide text-nje-border shadow-[var(--shadow-nje-flat-sm)] transition-[transform,box-shadow] duration-150',
          'hover:shadow-[var(--shadow-nje-flat)] disabled:cursor-not-allowed disabled:opacity-60 motion-safe:active:translate-y-px',
        )}
      >
        {status === 'submitting' ? 'Updating…' : 'Update password'}
      </button>
    </motion.form>
  )
}
