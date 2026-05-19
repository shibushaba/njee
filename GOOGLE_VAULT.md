# Google Drive + Memories

## Where files go

- **Bytes:** Google Drive — under your configured root folder, in **`Photos`** or **`Videos`** (auto-created).
- **Thread metadata:** Supabase `public.messages` — `media_url` is stored as `gdrive:<googleFileId>`. Thread previews and playback use **link-style URLs** after upload (no viewer Google login). Google OAuth on a device is for **uploading** and for **deleting** files after view limits.

There is **no separate Vault tab**; **Memories** is the only media surface.

## Both upload, both watch without Google sign-in

**Upload:** whoever sends a memory must connect Google on **that** device first (Drive API needs a token). With the shared root folder shared to **both** Google accounts (typically **Editor**), either person can upload.

After upload, the app sets Drive permission **`anyone` / `reader`** on each file so playback uses **public-style URLs** (thumbnail, image view, video embed). **Neither** of you needs to stay signed in to Google to **open** memories—the app account (Supabase) is enough for the chat; playback uses the shared link.

**Privacy tradeoff:** anyone who obtains the link could open the file until it is deleted. This is intentional for “tap and play” without a second OAuth flow.

## Storage after view limits

When a memory hits **view once / twice** and locks, the app tries to **delete the file on Drive** and clear `media_url` / `media_type` in Supabase (migration **`007_clear_locked_drive_media.sql`** — RPC `clear_locked_media_path`). Purge runs from a device that still has a **valid Google access token** with permission to delete that file (usually whoever uploaded it). The uploader opening Memories can sweep **their** locked rows; if both use Google, either account with delete access can free quota.

## Environment (`.env.local`)

- `VITE_GOOGLE_CLIENT_ID` — OAuth **Web client ID** (safe to expose in the SPA).
- `VITE_GOOGLE_DRIVE_ROOT_FOLDER_ID` — Shared folder ID (both Google accounts need access).
- `VITE_GOOGLE_SHARED_DRIVE_ID` — Optional Team Drive id.

**Never** add `client_secret` to Vite or ship it in the frontend. If it was ever pasted in chat or committed, **rotate it** in Google Cloud Console.

## Optional: `drive_files` table

Migration `006_drive_files.sql` is **optional** (legacy explorer index). Memories do **not** require it.

## Google Cloud

Enable **Google Drive API**. Under OAuth client → **Authorized JavaScript origins**, add your dev and production site origins (e.g. `http://localhost:5173`).
