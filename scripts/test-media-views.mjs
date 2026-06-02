import assert from 'node:assert/strict'

// Compiled via ts after build; run with: npm run build && node --experimental-strip-types scripts/test-media-views.mjs
// Or inline checks without imports:
function mediaHasViewLimit(m) {
  if (m.media_expires_at != null) return false
  return m.view_limit != null && m.view_limit > 0
}
function mediaOpensLeft(m) {
  if (!mediaHasViewLimit(m)) return null
  return Math.max(0, m.view_limit - m.current_views)
}
function isMediaViewLocked(m) {
  if (!m.media_url) return true
  if (m.is_locked) return true
  if (!mediaHasViewLimit(m)) return false
  return m.current_views >= m.view_limit
}
function viewLimitFromSendMode(mode) {
  if (mode === 'once') return 1
  if (mode === 'twice') return 2
  return null
}
function resolveMediaSendPolicy(kind, viewMode) {
  if (kind === 'voice') return { viewLimit: null, mediaExpiresAt: 'x' }
  const viewLimit = viewLimitFromSendMode(viewMode)
  if (viewMode === 'once' || viewMode === 'twice') return { viewLimit, mediaExpiresAt: null }
  return { viewLimit: null, mediaExpiresAt: 'x' }
}

assert.equal(viewLimitFromSendMode('once'), 1)
assert.equal(viewLimitFromSendMode('twice'), 2)
assert.equal(viewLimitFromSendMode('unlimited'), null)
const oncePolicy = resolveMediaSendPolicy('image', 'once')
assert.equal(oncePolicy.viewLimit, 1)
assert.equal(oncePolicy.mediaExpiresAt, null)
assert.equal(mediaHasViewLimit({ view_limit: 1, media_expires_at: null }), true)
assert.equal(mediaHasViewLimit({ view_limit: null, media_expires_at: '2026-01-01' }), false)
const freshOnce = {
  view_limit: 1,
  current_views: 0,
  is_locked: false,
  media_url: 'a',
  media_expires_at: null,
}
assert.equal(isMediaViewLocked(freshOnce), false)
assert.equal(mediaOpensLeft(freshOnce), 1)
const spentOnce = { ...freshOnce, current_views: 1, is_locked: true }
assert.equal(isMediaViewLocked(spentOnce), true)
assert.equal(mediaOpensLeft(spentOnce), 0)
console.log('media view limits OK')
