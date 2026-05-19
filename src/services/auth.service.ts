import type { AuthError } from '@supabase/supabase-js'
import { usernameToLoginEmail } from '../config/njeAuth'
import { supabase } from '../lib/supabase'

function invalidCredentialsError(): AuthError {
  return {
    name: 'AuthError',
    message: 'Invalid username or password.',
    status: 400,
  } as AuthError
}

export async function signInWithAllowedUsername(username: string, password: string) {
  const email = usernameToLoginEmail(username)
  if (!email) {
    return { data: { session: null, user: null }, error: invalidCredentialsError() }
  }
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOutEverywhere() {
  return supabase.auth.signOut({ scope: 'global' })
}

export async function changePasswordWithVerification(
  email: string,
  currentPassword: string,
  newPassword: string,
) {
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  })
  if (verifyError) {
    return { error: verifyError }
  }
  return supabase.auth.updateUser({ password: newPassword })
}
