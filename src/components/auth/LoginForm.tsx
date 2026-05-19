import { motion } from 'framer-motion'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { signInWithAllowedUsername } from '../../services/auth.service'
import { cn } from '../../lib/cn'
import { PasswordField } from './PasswordField'
import { usePasswordVisibility } from '../../hooks/usePasswordVisibility'

type FormStatus = 'idle' | 'submitting' | 'error'

export function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const pwd = usePasswordVisibility()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setErrorMessage(null)
    setStatus('submitting')

    const { error } = await signInWithAllowedUsername(username, password)
    if (error) {
      setStatus('error')
      setErrorMessage(error.message || 'Invalid username or password.')
      return
    }

    setStatus('idle')
  }

  return (
    <motion.form
      onSubmit={onSubmit}
      className="w-full max-w-md border-[3px] border-nje-border bg-nje-surface p-gutter-md shadow-[var(--shadow-nje-flat)] sm:p-gutter-lg"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      <label htmlFor="nje-username" className="text-xs font-bold uppercase tracking-[0.2em] text-nje-muted">
        Username
      </label>
      <input
        id="nje-username"
        name="username"
        type="text"
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        required
        value={username}
        disabled={status === 'submitting'}
        onChange={(e) => setUsername(e.target.value)}
        className={cn(
          'mt-stack-md w-full border-[3px] border-nje-border bg-nje-bg px-3 py-3 text-base text-nje-border outline-none transition-shadow duration-150',
          'placeholder:text-nje-whisper focus-visible:shadow-[var(--shadow-nje-flat-sm)]',
        )}
        placeholder="finu or shibu"
      />

      <div className="mt-stack-lg">
        <PasswordField
          id="nje-password"
          name="password"
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          disabled={status === 'submitting'}
          visible={pwd.visible}
          onToggleVisible={pwd.toggle}
        />
      </div>

      {errorMessage ? (
        <p className="mt-stack-md text-sm font-medium text-nje-border" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className={cn(
          'mt-stack-lg w-full border-[3px] border-nje-border bg-nje-yellow px-4 py-3.5 text-sm font-bold uppercase tracking-wide text-nje-border shadow-[var(--shadow-nje-flat-sm)] transition-[transform,box-shadow] duration-150',
          'hover:shadow-[var(--shadow-nje-flat)] disabled:cursor-not-allowed disabled:opacity-60 motion-safe:active:translate-y-px',
        )}
      >
        {status === 'submitting' ? 'Signing in…' : 'Sign in'}
      </button>
    </motion.form>
  )
}
