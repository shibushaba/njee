import assert from 'node:assert/strict'

function mediaViewLimitValue(m) {
  if (m.media_view_mode === 'once') return 1
  if (m.media_view_mode === 'twice') return 2
  if (m.view_limit != null && m.view_limit > 0) return m.view_limit
  return null
}

function mediaHasViewLimit(m) {
  return mediaViewLimitValue(m) != null
}

function effectiveViewCount(messageId, serverViews, sessionMap) {
  return Math.max(serverViews, sessionMap[messageId] ?? 0)
}

function applyLimitedViewOpen(messageId, viewLimit, serverViewsBefore, sessionMap) {
  const sessionCount = (sessionMap[messageId] ?? 0) + 1
  sessionMap[messageId] = sessionCount
  const next = Math.max(sessionCount, serverViewsBefore + 1)
  const exhausted = next >= viewLimit
  return { current_views: next, is_locked: exhausted, exhausted }
}

const session = {}

assert.equal(mediaViewLimitValue({ media_view_mode: 'once', view_limit: null }), 1)
assert.equal(mediaViewLimitValue({ media_view_mode: null, view_limit: 2 }), 2)
assert.equal(mediaHasViewLimit({ media_view_mode: 'keep', view_limit: null }), false)

let r = applyLimitedViewOpen('msg-1', 1, 0, session)
assert.equal(r.exhausted, true)
assert.equal(r.current_views, 1)
assert.equal(effectiveViewCount('msg-1', 0, session), 1)

r = applyLimitedViewOpen('msg-2', 2, 0, session)
assert.equal(r.exhausted, false)
assert.equal(r.current_views, 1)

r = applyLimitedViewOpen('msg-2', 2, 1, session)
assert.equal(r.exhausted, true)
assert.equal(r.current_views, 2)

console.log('media view limits OK (strict once/twice)')
