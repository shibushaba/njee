import { registerSW } from 'virtual:pwa-register'

let applyUpdate: ((reloadPage?: boolean) => Promise<void>) | undefined
let started = false

/** Call once after the shell loads (client only). */
export function initPwaRegistration() {
  if (typeof window === 'undefined' || started) return
  started = true

  applyUpdate = registerSW({
    onNeedRefresh() {
      window.dispatchEvent(new CustomEvent('nje-pwa-need-refresh'))
    },
    onOfflineReady() {
      window.dispatchEvent(new CustomEvent('nje-pwa-offline-ready'))
    },
  })
}

export function reloadToActivatePwaUpdate() {
  return applyUpdate?.(true)
}
