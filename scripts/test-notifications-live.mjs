/**
 * Live Supabase smoke test — verifies notifications table + RPC exist.
 * Run: npm run test:notifications:live
 * Requires .env.local with VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

function loadEnvLocal() {
  const file = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(file)) {
    throw new Error('Missing .env.local — cannot run live notification smoke test.')
  }
  const env = {}
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    env[key] = val
  }
  return env
}

const env = loadEnvLocal()
const url = env.VITE_SUPABASE_URL
const key = env.VITE_SUPABASE_ANON_KEY
assert.ok(url && key, 'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY required in .env.local')

const supabase = createClient(url, key)

const { error: tableErr } = await supabase.from('notifications').select('id').limit(1)
assert.ok(
  !tableErr || tableErr.code === 'PGRST116' || tableErr.message.includes('row-level security'),
  `notifications table missing or unreachable: ${tableErr?.message ?? 'unknown'}`,
)

const { error: prefsErr } = await supabase.from('notification_preferences').select('user_id').limit(1)
assert.ok(
  !prefsErr || prefsErr.code === 'PGRST116' || prefsErr.message.includes('row-level security'),
  `notification_preferences table missing: ${prefsErr?.message ?? 'unknown'}`,
)

const { error: rpcErr } = await supabase.rpc('count_unread_notifications', { p_user: '00000000-0000-0000-0000-000000000000' })
assert.ok(!rpcErr, `count_unread_notifications RPC missing: ${rpcErr?.message ?? 'unknown'}`)

const swBridge = path.join(process.cwd(), 'public', 'pwa-push-bridge.js')
assert.ok(fs.existsSync(swBridge), 'public/pwa-push-bridge.js missing')
const bridgeSrc = fs.readFileSync(swBridge, 'utf8')
assert.ok(bridgeSrc.includes('showNotification'), 'push bridge must call showNotification')
assert.ok(bridgeSrc.includes('notificationclick'), 'push bridge must handle notificationclick')

console.log('[test-notifications:live] Supabase schema + push bridge OK.')
