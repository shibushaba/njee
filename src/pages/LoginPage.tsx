import { motion } from 'framer-motion'
import { Navigate, useLocation } from 'react-router-dom'
import { LoginForm } from '../components/auth/LoginForm'
import { useAuth } from '../hooks/useAuth'

export function LoginPage() {
  const { session, status } = useAuth()
  const location = useLocation()
  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/'

  if (status === 'ready' && session) {
    return <Navigate to={from} replace />
  }

  return (
    <div className="flex min-h-dvh flex-col justify-center px-gutter py-stack-xl sm:px-gutter-md">
      <motion.div
        className="mx-auto w-full max-w-lg"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <header className="mb-stack-lg border-b-[3px] border-nje-border pb-stack-lg">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.28em] text-nje-whisper">
            Sign in
          </p>
          <h1 className="mt-stack-md text-3xl font-bold tracking-tight text-nje-border sm:text-4xl">
            nje
          </h1>
          <p className="mt-stack-md max-w-prose text-sm leading-relaxed text-nje-muted sm:text-base">
            ellathum njenjenje — sign in with your username and password.
          </p>
        </header>
        <LoginForm />
      </motion.div>
    </div>
  )
}
