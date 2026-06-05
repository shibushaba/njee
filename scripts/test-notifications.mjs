/**
 * Unit checks for notification delivery helpers (run: npm run test:notifications).
 */
import assert from 'node:assert/strict'

function notificationUrlForKind(kind) {
  switch (kind) {
    case 'streak':
      return '/ritual'
    case 'pinned_moment':
      return '/moments'
    case 'watch_shelf':
      return '/lounge/watch'
    case 'time_capsule':
      return '/lounge/capsules'
    case 'shared_collection':
      return '/memories'
    case 'presence':
      return '/chat'
    default:
      return '/chat'
  }
}

function shouldDeliverInAppToast(visibility) {
  return visibility === 'visible'
}

function shouldDeliverOsNotification(visibility, permission) {
  return visibility === 'hidden' && permission === 'granted'
}

function kindAllowsBrowserPush(kind, prefs) {
  switch (kind) {
    case 'message':
      return prefs.notify_message
    case 'media':
      return prefs.notify_media
    case 'streak':
      return prefs.notify_streak
    case 'time_capsule':
      return prefs.notify_time_capsule
    case 'shared_collection':
      return prefs.notify_shared_collection
    case 'presence':
      return prefs.notify_presence
    case 'pinned_moment':
      return prefs.notify_pinned_moment
    case 'watch_shelf':
      return prefs.notify_watch_shelf
    default:
      return true
  }
}

assert.equal(notificationUrlForKind('message'), '/chat')
assert.equal(notificationUrlForKind('streak'), '/ritual')
assert.equal(notificationUrlForKind('watch_shelf'), '/lounge/watch')

assert.equal(shouldDeliverInAppToast('visible'), true)
assert.equal(shouldDeliverInAppToast('hidden'), false)
assert.equal(shouldDeliverOsNotification('hidden', 'granted'), true)
assert.equal(shouldDeliverOsNotification('visible', 'granted'), false)

const prefs = {
  notify_message: true,
  notify_media: false,
  notify_streak: true,
  notify_time_capsule: true,
  notify_shared_collection: true,
  notify_presence: false,
  notify_pinned_moment: true,
  notify_watch_shelf: true,
}
assert.equal(kindAllowsBrowserPush('message', prefs), true)
assert.equal(kindAllowsBrowserPush('media', prefs), false)

console.log('[test-notifications] All checks passed.')
