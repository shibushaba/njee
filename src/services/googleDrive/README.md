# Google Drive in nje

## Browser (this folder)

- OAuth tokens come from **Google Identity Services** (`accounts.google.com/gsi/client`).
- Drive REST calls use `fetch` / `XMLHttpRequest` in `driveApi.ts`.
- `gapi-script` primes the legacy `gapi` global for future features (e.g. Drive Picker); uploads do not require it.

## Server (`googleapis` package)

The `googleapis` npm package is intended for **Node / Deno backends** (e.g. Supabase Edge Functions) where a **client secret** or service account can live safely. **Do not import `googleapis` from React components** — it bloats the bundle and encourages unsafe patterns.

Recommended next step for production: an Edge Function that:

1. Accepts an upload session or short-lived delegated token.
2. Uses a service account or stored refresh token with `googleapis`.
3. Returns file ids / links to the client.

Until then, the SPA uploads directly with the user’s OAuth access token (fine for a private two-person app if both trust the client).
