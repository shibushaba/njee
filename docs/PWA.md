# Progressive Web App (nje)

Production builds use **[vite-plugin-pwa](https://vite-pwa-org.netlify.app/)** with Workbox precaching, **`display: standalone`**, portrait orientation, and a warm manifest aligned with nje’s palette.

## Icons

Before `npm run build`, **`prebuild`** runs `scripts/generate-pwa-icons.mjs`, which writes:

- `public/pwa-192.png`
- `public/pwa-512.png`
- `public/pwa-maskable-512.png`

**Source image (priority):** save your master art as **`scripts/pwa-icon-source.png`**. The script uses **nearest-neighbor** scaling to keep pixel art crisp.

If that file is missing, the script falls back to rasterizing **`public/favicon.svg`** so CI and fresh clones still build.

## Service worker & Web Push

- The main **`/sw.js`** is emitted at build time (do not commit a hand-written `public/sw.js`).
- **`public/pwa-push-bridge.js`** holds the `push` and `notificationclick` listeners used for Web Push; Workbox loads it with `importScripts`.
- The app registers the worker from **`src/pwa/registerPwa.ts`** (`registerType: 'prompt'`). Push subscription code reuses the same registration when possible (`src/services/pushSubscription.service.ts`).

## UX

- **`SplashScreen`** + **`TypingSplashAnimation`**: boot experience with “nje nje nje nje” typing and a soft cursor.
- **`PwaShell`**: calm install strip, update toast, and offline ribbon (mounted after the splash dismisses so it never covers the opening ritual).

## Local PWA testing

Use **`npm run build`** then **`npm run preview`** and open the printed HTTPS URL (or `http://localhost:4173`); install prompts behave best on a real device or Chrome Android emulation.
