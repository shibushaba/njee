import { usePWA } from '../../hooks/usePWA'
import { InstallPrompt } from './InstallPrompt'
import { OfflineIndicator } from './OfflineIndicator'
import { PWAUpdateToast } from './PWAUpdateToast'

/** One place for PWA listeners + calm global chrome (install / update / offline). */
export function PwaShell() {
  const pwa = usePWA()

  return (
    <>
      <OfflineIndicator visible={!pwa.online} />
      <PWAUpdateToast visible={pwa.updateAvailable} onApply={pwa.applyUpdate} onDismiss={pwa.dismissUpdateToast} />
      <InstallPrompt
        visible={pwa.installable}
        onInstall={pwa.promptInstall}
        onDismiss={pwa.dismissInstallPrompt}
      />
    </>
  )
}
