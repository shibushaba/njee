import { loadGapiInsideDOM } from 'gapi-script'

let identityScriptPromise: Promise<void> | null = null

/** Google Identity Services (OAuth token client). */
export function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  if (identityScriptPromise) return identityScriptPromise
  identityScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-nje-gis="1"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Google Identity script failed')), { once: true })
      return
    }
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.dataset.njeGis = '1'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Could not load Google Identity script'))
    document.head.appendChild(s)
  })
  return identityScriptPromise
}

/** Loads `gapi` (requested dependency) for future picker / client flows; token auth uses GIS. */
export async function loadGooglePlatform(): Promise<void> {
  await Promise.all([loadGoogleIdentityScript(), loadGapiInsideDOM()])
}
