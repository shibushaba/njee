/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  /** Google OAuth Web client ID (public). Never put client secret in Vite env. */
  readonly VITE_GOOGLE_CLIENT_ID?: string
  /** Parent folder in Drive (or Shared Drive) where category subfolders live. */
  readonly VITE_GOOGLE_DRIVE_ROOT_FOLDER_ID?: string
  /** Optional Team Drive id when the vault root lives on a Shared Drive. */
  readonly VITE_GOOGLE_SHARED_DRIVE_ID?: string
  /** Web Push / VAPID public key (URL-safe base64). Pair with Edge secrets + `push-notify` function. */
  readonly VITE_VAPID_PUBLIC_KEY?: string
  /** Pepper for time-capsule AES-GCM (client-side seal). Same value in every deployed build. */
  readonly VITE_TIME_CAPSULE_SECRET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
