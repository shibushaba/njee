import { useCallback, useEffect, useRef, useState } from 'react'

const INSTALL_DISMISS_KEY = 'nje-pwa-install-dismissed-at'
const INSTALL_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function readInstallSnoozed(): boolean {
  try {
    const raw = localStorage.getItem(INSTALL_DISMISS_KEY)
    if (!raw) return false
    const t = Number(raw)
    if (!Number.isFinite(t)) return false
    return Date.now() - t < INSTALL_COOLDOWN_MS
  } catch {
    return false
  }
}

function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export function usePWA() {
  const [online, setOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null)
  const [installable, setInstallable] = useState(false)
  const [standalone, setStandalone] = useState(isStandaloneDisplay)
  const [installSnoozed, setInstallSnoozed] = useState(readInstallSnoozed)

  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  useEffect(() => {
    const onNeed = () => setUpdateAvailable(true)
    window.addEventListener('nje-pwa-need-refresh', onNeed)
    return () => window.removeEventListener('nje-pwa-need-refresh', onNeed)
  }, [])

  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault()
      deferredRef.current = e as BeforeInstallPromptEvent
      setInstallable(true)
    }
    window.addEventListener('beforeinstallprompt', onBip)
    return () => window.removeEventListener('beforeinstallprompt', onBip)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)')
    const sync = () => setStandalone(isStandaloneDisplay())
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const promptInstall = useCallback(async () => {
    const ev = deferredRef.current
    if (!ev) return
    deferredRef.current = null
    setInstallable(false)
    await ev.prompt()
    await ev.userChoice
  }, [])

  const dismissInstallPrompt = useCallback(() => {
    setInstallSnoozed(true)
    try {
      localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now()))
    } catch {
      /* ignore */
    }
  }, [])

  const applyUpdate = useCallback(async () => {
    const { reloadToActivatePwaUpdate } = await import('../pwa/registerPwa')
    await reloadToActivatePwaUpdate()
  }, [])

  const dismissUpdateToast = useCallback(() => {
    setUpdateAvailable(false)
  }, [])

  return {
    online,
    standalone,
    updateAvailable,
    installable: installable && !standalone && !installSnoozed,
    promptInstall,
    dismissInstallPrompt,
    applyUpdate,
    dismissUpdateToast,
  }
}
