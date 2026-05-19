import { useMemo } from 'react'
import { loginEmailToUsername } from '../config/njeAuth'
import { useAuth } from './useAuth'

export function useNjeProfile() {
  const { user } = useAuth()

  const username = useMemo(() => {
    if (!user?.email) return null
    return loginEmailToUsername(user.email)
  }, [user?.email])

  return { username }
}
