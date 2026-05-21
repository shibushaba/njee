import { useCallback, useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useNotificationHub } from '../../providers/NotificationProvider'
import {
  isThisDeviceWebPushRegistered,
  subscribeWebPushAndSave,
  unsubscribeWebPushAndRemove,
} from '../../services/pushSubscription.service'
import { NjeCard } from '../ui/NjeCard'
import {
  browserNotificationsSupported,
  getNotificationPermission,
  requestNotificationPermission,
} from '../../utils/browserNotifications'
import { isWebPushConfigured, supportsServiceWorkerPush } from '../../utils/webPush'
import { cn } from '../../lib/cn'

type ToggleRowProps = {
  label: string
  description: string
  checked: boolean
  disabled?: boolean
  onChange: (next: boolean) => void
}

function ToggleRow({ label, description, checked, disabled, onChange }: ToggleRowProps) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 border-b-[2px] border-nje-border/12 py-3 last:border-b-0',
        disabled && 'opacity-50',
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-bold text-nje-border">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-nje-muted">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-7 w-12 shrink-0 border-[2px] border-nje-border shadow-[0_2px_0_0_rgba(90,46,30,0.06)] transition-colors',
          checked ? 'bg-nje-mint' : 'bg-nje-bg',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 border-[2px] border-nje-border bg-nje-surface transition-transform',
            checked ? 'translate-x-6' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  )
}

export function NotificationSettings() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const { prefs, loadingPrefs, updatePreferences } = useNotificationHub()
  const [busy, setBusy] = useState(false)
  const [browserMsg, setBrowserMsg] = useState<string | null>(null)
  const [webBusy, setWebBusy] = useState(false)
  const [webPushMsg, setWebPushMsg] = useState<string | null>(null)
  const [hasWebDevice, setHasWebDevice] = useState(false)

  const p = prefs
  const patch = useCallback(
    async (partial: Parameters<typeof updatePreferences>[0]) => {
      setBusy(true)
      const { error } = await updatePreferences(partial)
      setBusy(false)
      if (error) setBrowserMsg(error)
      else setBrowserMsg(null)
    },
    [updatePreferences],
  )

  const handleBrowserEnable = useCallback(async () => {
    if (!browserNotificationsSupported()) {
      setBrowserMsg('This browser does not support quiet desktop alerts.')
      return
    }
    const nextPerm = await requestNotificationPermission()
    if (nextPerm === 'granted') {
      await patch({ browser_push: true })
      setBrowserMsg('Soft alerts are on when this tab is in the background.')
    } else if (nextPerm === 'denied') {
      await patch({ browser_push: false })
      setBrowserMsg('Browser blocked alerts — you can change that in site settings if you want them later.')
    } else {
      setBrowserMsg('No permission yet — we will not nag you again from here.')
    }
  }, [patch])

  const refreshWebDevice = useCallback(async () => {
    if (!userId) {
      setHasWebDevice(false)
      return
    }
    setHasWebDevice(await isThisDeviceWebPushRegistered(userId))
  }, [userId])

  useEffect(() => {
    void refreshWebDevice()
  }, [refreshWebDevice, loadingPrefs])

  const handleRegisterWebPush = useCallback(async () => {
    if (!userId) return
    if (!isWebPushConfigured()) {
      setWebPushMsg('Web push is not enabled in this build.')
      return
    }
    if (!supportsServiceWorkerPush()) {
      setWebPushMsg('This browser cannot register background web push.')
      return
    }
    if (!browserNotificationsSupported()) {
      setWebPushMsg('Notifications are not available in this browser.')
      return
    }
    let np = getNotificationPermission()
    if (np === 'default') {
      np = await requestNotificationPermission()
    }
    if (np !== 'granted') {
      setWebPushMsg('Allow notifications so this device can receive gentle pushes.')
      return
    }
    setWebBusy(true)
    setWebPushMsg(null)
    const { error } = await subscribeWebPushAndSave(userId)
    setWebBusy(false)
    if (error) {
      setWebPushMsg(error)
      return
    }
    await refreshWebDevice()
    setWebPushMsg('This device is registered.')
  }, [userId, refreshWebDevice])

  const handleRemoveWebPush = useCallback(async () => {
    if (!userId) return
    setWebBusy(true)
    setWebPushMsg(null)
    const { error } = await unsubscribeWebPushAndRemove(userId)
    setWebBusy(false)
    if (error) setWebPushMsg(error)
    else {
      await refreshWebDevice()
      setWebPushMsg('Removed this device from web push.')
    }
  }, [userId, refreshWebDevice])

  const perm = getNotificationPermission()

  if (loadingPrefs && !p) {
    return (
      <div className="space-y-3">
        <div className="h-24 animate-pulse border-[2px] border-nje-border/30 bg-nje-bg/80" />
        <div className="h-40 animate-pulse border-[2px] border-nje-border/30 bg-nje-bg/80" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-stack-md">
      <NjeCard tone="surface" padding="lg" className="shadow-[var(--shadow-nje-flat-sm)]">
        <p className="text-[0.58rem] font-bold uppercase tracking-[0.2em] text-nje-whisper">In the app</p>
        <p className="mt-1 text-xs leading-relaxed text-nje-muted">
          Turn categories off anytime. Nothing here is designed to pull you back constantly.
        </p>
        <div className="mt-2">
          <ToggleRow
            label="New notes"
            description="When they send you text."
            checked={p?.notify_message ?? true}
            disabled={busy}
            onChange={(v) => void patch({ notify_message: v })}
          />
          <ToggleRow
            label="Photos & video"
            description="When they share a moment."
            checked={p?.notify_media ?? true}
            disabled={busy}
            onChange={(v) => void patch({ notify_media: v })}
          />
          <ToggleRow
            label="Shared ritual"
            description="When your quiet streak grows."
            checked={p?.notify_streak ?? true}
            disabled={busy}
            onChange={(v) => void patch({ notify_streak: v })}
          />
          <ToggleRow
            label="Time capsules"
            description="Reserved for when that feature arrives."
            checked={p?.notify_time_capsule ?? true}
            disabled={busy}
            onChange={(v) => void patch({ notify_time_capsule: v })}
          />
          <ToggleRow
            label="Shared collections"
            description="Reserved for shared shelves later."
            checked={p?.notify_shared_collection ?? true}
            disabled={busy}
            onChange={(v) => void patch({ notify_shared_collection: v })}
          />
          <ToggleRow
            label="Presence"
            description="Very light — off by default so the room stays calm."
            checked={p?.notify_presence ?? false}
            disabled={busy}
            onChange={(v) => void patch({ notify_presence: v })}
          />
        </div>
      </NjeCard>

      <NjeCard tone="yellow" padding="lg" className="shadow-[var(--shadow-nje-flat-sm)]">
        <p className="text-[0.58rem] font-bold uppercase tracking-[0.2em] text-nje-whisper">Outside the app</p>
        <p className="mt-1 text-xs leading-relaxed text-nje-muted">
          When nje is open in another tab, soft silent alerts can still reach you.
        </p>
        <div className="mt-stack-md flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            disabled={busy || perm === 'unsupported'}
            onClick={() => void handleBrowserEnable()}
            className="border-[2px] border-nje-border bg-nje-mint px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-nje-border shadow-[0_2px_0_0_rgba(90,46,30,0.06)] disabled:opacity-50"
          >
            {p?.browser_push && perm === 'granted' ? 'Browser alerts on' : 'Enable soft browser alerts'}
          </button>
          {p?.browser_push && perm === 'granted' ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void patch({ browser_push: false })}
              className="border-[2px] border-nje-border bg-nje-surface px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-nje-muted shadow-[0_2px_0_0_rgba(90,46,30,0.05)]"
            >
              Turn off
            </button>
          ) : null}
        </div>
        {browserMsg ? <p className="mt-2 text-xs text-nje-muted">{browserMsg}</p> : null}
      </NjeCard>

      {isWebPushConfigured() ? (
        <NjeCard tone="surface" padding="lg" className="border-nje-border shadow-[var(--shadow-nje-flat-sm)]">
          <p className="text-[0.58rem] font-bold uppercase tracking-[0.2em] text-nje-whisper">Web push (this device)</p>
          <p className="mt-1 text-xs leading-relaxed text-nje-muted">
            Quiet alerts when nje is fully closed — only on this browser, only if you register below.
          </p>
          {!supportsServiceWorkerPush() ? (
            <p className="mt-2 text-xs text-nje-muted">This browser does not support service worker push.</p>
          ) : (
            <div className="mt-stack-md flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                type="button"
                disabled={webBusy || hasWebDevice}
                onClick={() => void handleRegisterWebPush()}
                className="border-[2px] border-nje-border bg-nje-mint px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-nje-border shadow-[0_2px_0_0_rgba(90,46,30,0.06)] disabled:opacity-50"
              >
                {hasWebDevice ? 'This device registered' : 'Register this device'}
              </button>
              {hasWebDevice ? (
                <button
                  type="button"
                  disabled={webBusy}
                  onClick={() => void handleRemoveWebPush()}
                  className="border-[2px] border-nje-border bg-nje-surface px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-nje-muted shadow-[0_2px_0_0_rgba(90,46,30,0.05)]"
                >
                  Remove this device
                </button>
              ) : null}
            </div>
          )}
          {webPushMsg ? <p className="mt-2 text-xs text-nje-muted">{webPushMsg}</p> : null}
        </NjeCard>
      ) : null}

      <NavLink
        to="/settings"
        className="inline-flex w-fit border-[2px] border-nje-border bg-nje-surface px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-nje-border shadow-[0_2px_0_0_rgba(90,46,30,0.06)]"
      >
        Back to settings
      </NavLink>
    </div>
  )
}
