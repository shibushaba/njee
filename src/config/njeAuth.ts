/** Internal login identity for Supabase email/password auth. */
export const NJE_AUTH_EMAIL_DOMAIN = '@nje.app' as const

export const NJE_ALLOWED_USERNAMES = ['finu', 'shibu'] as const

export type NjeUsername = (typeof NJE_ALLOWED_USERNAMES)[number]

export function isNjeUsername(value: string): value is NjeUsername {
  return (NJE_ALLOWED_USERNAMES as readonly string[]).includes(value.toLowerCase())
}

/** Map visible username to hidden Supabase login email. */
export function usernameToLoginEmail(username: string): string | null {
  const normalized = username.trim().toLowerCase()
  if (!isNjeUsername(normalized)) return null
  return `${normalized}${NJE_AUTH_EMAIL_DOMAIN}`
}

/** Derive display username from session email (never show raw email in UI). */
export function loginEmailToUsername(email: string): string | null {
  if (!email.toLowerCase().endsWith(NJE_AUTH_EMAIL_DOMAIN)) return null
  const base = email.slice(0, -NJE_AUTH_EMAIL_DOMAIN.length).toLowerCase()
  return isNjeUsername(base) ? base : null
}
