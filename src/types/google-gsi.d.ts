/** Minimal typings for Google Identity Services (loaded from CDN). */
export {}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (resp: { access_token?: string; expires_in?: number; error?: string }) => void
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: '' | 'none' | 'consent' | 'select_account' }) => void
          }
        }
      }
    }
  }
}
