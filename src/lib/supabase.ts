import { createClient } from '@supabase/supabase-js'

function readEnv(key: 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY'): string {
  const value = import.meta.env[key]
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(
      `Missing ${key}. Add it to .env.local (see .env.example).`,
    )
  }
  return value
}

const supabaseUrl = readEnv('VITE_SUPABASE_URL')
const supabaseAnonKey = readEnv('VITE_SUPABASE_ANON_KEY')

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
})
