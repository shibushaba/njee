import type { Session, User } from '@supabase/supabase-js'
import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'

export type AuthStatus = 'loading' | 'ready'

export type AuthContextValue = {
  status: AuthStatus
  session: Session | null
  user: User | null
  refreshSession: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [session, setSession] = useState<Session | null>(null)

  const refreshSession = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      setSession(null)
      return
    }
    setSession(data.session ?? null)
  }, [])

  useEffect(() => {
    let cancelled = false

    void supabase.auth.getSession().then(({ data, error }) => {
      if (cancelled) return
      if (error) {
        setSession(null)
      } else {
        setSession(data.session ?? null)
      }
      setStatus('ready')
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (cancelled) return
      setSession(nextSession)
      setStatus('ready')
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      user: session?.user ?? null,
      refreshSession,
    }),
    [refreshSession, session, status],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
