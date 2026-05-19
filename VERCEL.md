# Deploying to Vercel (njee.vercel.app)

## Blank site / “nothing loads”

Vite inlines **`VITE_*` variables at build time**. If they are missing in Vercel when the project builds, the old bundle had no Supabase URL/key and the app used to crash on load (white screen).

1. **Vercel** → your project → **Settings** → **Environment Variables**
2. Add (same values as `.env.local`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - For Memories uploads: `VITE_GOOGLE_CLIENT_ID`, `VITE_GOOGLE_DRIVE_ROOT_FOLDER_ID`
   - Optional: `VITE_GOOGLE_SHARED_DRIVE_ID`
3. Enable them for **Production** (and **Preview** if you use preview URLs).
4. **Deployments** → open the latest deployment → **⋯** → **Redeploy** (or push a new commit).

Until env is set and a new deployment finishes, the live site may show a **configuration** screen instead of a blank page.

## SPA routing

`vercel.json` rewrites unknown paths to `index.html` so client-side routes (e.g. `/memories`) work on refresh.

## Supabase Auth

Under **Authentication** → **URL configuration**, add your site origin if Supabase requires it (e.g. `https://njee.vercel.app`).

## Google OAuth

Google Cloud Console → **Credentials** → your OAuth 2.0 Web client → **Authorized JavaScript origins** must include:

- `https://njee.vercel.app` (and `http://localhost:5173` for local dev)

Otherwise “Connect Google” fails in production.
