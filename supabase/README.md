# Supabase: nje chat

1. Run `migrations/001_messages_and_profiles.sql` in the Supabase SQL editor.
2. Run `migrations/002_media_storage.sql` for **private media** (`storage` bucket `media`) and message columns `media_url`, `media_type`, `view_limit`, `current_views`.
3. Run `migrations/003_disappearing_media.sql` for **`is_locked`**, **`message_views`**, and RPC **`record_message_media_view`** (replaces `increment_message_media_views`).
4. Run `migrations/004_realtime_messages.sql` so **`messages`** is part of the **`supabase_realtime`** publication (instant `current_views` / `is_locked` sync). If it errors because the table is already published, you can skip it.
5. Run `migrations/005_message_reply_delete.sql` for **reply metadata**, **soft delete** (`deleted_at`), sender **update** policy, and **`record_message_media_view`** guard on deleted rows. This migration matches **`reply_to_message_id`** and the RPC parameter type to **`messages.id`** (uuid or bigint). If `message_views.message_id` does not match `messages.id`, fix that first or the migration will raise a clear error.
6. _(Optional)_ Run `migrations/006_drive_files.sql` only if you use the legacy `drive_files` explorer table. **Memories** use `messages` + Google Drive and do not require `006`.
7. Run `migrations/007_clear_locked_drive_media.sql` so the app can clear **`media_url` / `media_type`** on **locked** Drive-backed messages after the file is deleted from Google Drive (saves your ~1 GB quota).
8. Run `migrations/008_daily_streaks.sql` for **`daily_streaks`**, **`refresh_daily_streak`**, message triggers, and **realtime** on the streak row (shared daily ritual counter for two users). If you see **`column "user_a" does not exist`**, you likely had an older `daily_streaks` table with a different shape — re-run the full migration file (it drops and recreates that table; streak rows are rebuilt from **`messages`** by the script at the end).
9. Run `migrations/009_notifications.sql` for **`notifications`**, **`notification_preferences`**, message + streak triggers, and **realtime** on both tables. **`notifications.ref_message_id`** is created as the same type as **`messages.id`** (uuid or bigint, matching migration **005**).
10. Run `migrations/010_push_subscriptions.sql` for **`push_subscriptions`** (Web Push device rows; RLS for authenticated users).
11. Run `migrations/011_profiles_presence.sql` for **ambient presence** on **`profiles`** (`presence_status`, `presence_updated_at`, `presence_auto_night` legacy column, `presence_idle_auto`) and **realtime** on **`profiles`** (live status sync). If the table is already in the publication, the migration skips the duplicate safely.
12. Run `migrations/012_presence_four_states.sql` to **narrow `presence_status`** to four values — **`active_now`**, **`sleeping`**, **`studying`**, **`away`** — and remap older states. Always run this after **011** so the app and database stay aligned.
13. Run `migrations/013_pinned_moments.sql` for **`pinned_moments`** (shared shelf: `message_id` type **matches `messages.id`** — uuid or bigint — plus `pair_key`, `pinned_by`, optional `context_label`) and **realtime** on that table. Re-run safe if a previous attempt failed (script drops and recreates the table).
14. Run `migrations/014_time_capsules.sql` for **`time_capsules`** (future-unlock messages: `unlock_at`, `is_unlocked`, `capsule_type`, `capsule_title`, optional `media_url` / `media_type`, `context_label`) and **realtime** on that table.
15. Run `migrations/015_shared_watch.sql` for **`watch_items`** (shared watchlist: `status`, `source_type`, `url`, `title`, `notes`, `context_label`) and **realtime** on that table.
16. Run `migrations/016_time_capsules_unlock_notify.sql` for the **`time_capsules`** unlock trigger (soft **`notifications`** rows for sender + receiver when **`is_unlocked`** becomes true; respects **`notification_preferences.notify_time_capsule`**).
17. Run `migrations/017_watch_suggestion_portal.sql` to evolve **`watch_items`** into the **two-way suggestion portal** (`recipient_id`, **`suggest_stars`**, **`priority`**, **`abi`**, **`stars_watch`**, **`watched_at`**, statuses **`suggested` / `watching` / `watched`**) and replace the insert policy so each row is a suggestion **from** `added_by` **to** `recipient_id`.
18. Run `migrations/018_watch_items_portal_idempotent.sql` **if** you still see **`Could not find the 'priority' column of 'watch_items' in the schema cache`** (or similar) after deploying the app: it re-applies the same portal columns, checks, and insert policy in an **idempotent** way (safe if **017** was never applied, only partly applied, or you need a clean re-run). After it succeeds, wait a minute or use **Dashboard → Settings → API → Restart project** (or run `notify pgrst, 'reload schema';` as a privileged role) so PostgREST picks up the new columns.
19. Run `migrations/019_watch_pinned_capsule_notify.sql` for **inbox notifications** on **pinned moments**, **watch shelf** (new suggestions + progress + edits), and **new time capsules** (receiver ping when a vault item is created). Adds **`notify_pinned_moment`** and **`notify_watch_shelf`** on **`notification_preferences`** and extends **`notifications.kind`**. Prefer running after **017/018** so watch triggers can use **`recipient_id`**.
20. Run `migrations/020_message_notification_title.sql` so new **text** notifications use the title **"A new message"** (replaces **"A new note"** in the DB trigger). The app inbox chip for `message` kind reads **MSG** after you deploy the matching frontend build.
21. Run `migrations/021_push_subscription_save_rpc.sql` if **Register this device** fails with **row-level security** on **`push_subscriptions`**. The RPC **`save_my_push_subscription`** clears any stale row for the same browser **endpoint**, then inserts for **`auth.uid()`** (fixes account switches and upsert-RLS conflicts).
22. Run `migrations/022_time_capsules_encryption.sql` for **`time_capsules.encryption_version`** and sealed-payload constraints. New capsules store **AES-GCM ciphertext** in **`content`** only (title/media cleared at rest); the app decrypts after **`unlock_at`**. Set **`VITE_TIME_CAPSULE_SECRET`** in `.env.local` / Vercel (see `.env.example`).
23. Run `migrations/023_media_voice_supabase.sql` for **voice** message type, **audio** MIME types on the **`media`** bucket, and RPC updates for view counting. **Chat** uploads use Supabase Storage with **Once / Twice / Keep**; **Memories** still uses Google Drive when connected. If **`messages_body_ck` violated by some row** appears, pull the latest 023 from the repo and run it again (it fixes purged media + tombstones before re-adding the check). Still stuck? Run this in SQL Editor and share/fix the returned rows:

```sql
select id, message_type, media_url, media_type, is_locked, deleted_at,
  char_length(trim(coalesce(content, ''))) as content_len
from public.messages m
where not (
  (deleted_at is null and message_type = 'text' and media_url is null
    and char_length(trim(content)) between 1 and 4000)
  or (deleted_at is null and message_type = 'image' and media_url is not null
    and media_type = 'image' and char_length(trim(coalesce(content, ''))) <= 4000)
  or (deleted_at is null and message_type = 'video' and media_url is not null
    and media_type = 'video' and char_length(trim(coalesce(content, ''))) <= 4000)
  or (deleted_at is null and message_type = 'voice' and media_url is not null
    and media_type = 'voice' and char_length(trim(coalesce(content, ''))) <= 4000)
  or (deleted_at is null and message_type in ('image', 'video', 'voice')
    and media_url is null and media_type is null and is_locked = true
    and char_length(trim(coalesce(content, ''))) <= 4000)
  or (deleted_at is not null and message_type = 'text' and media_url is null
    and media_type is null and char_length(trim(coalesce(content, ''))) between 0 and 4000)
);
```

24. Run `migrations/024_media_surface_expiry.sql` for **`media_surface`** (`chat` vs `memories`) and **`media_expires_at`** (~24h auto-purge for Keep + voice).
25. Run `migrations/025_notifications_hide_deleted_messages.sql` to remove inbox pings for **soft-deleted messages**, purge them on future deletes, and fix unread counts (`count_unread_notifications` RPC).
26. **Profiles:** insert one row per auth user so the app can resolve the other user (two accounts only):
insert into public.profiles (id, username)
select id, 'finu' from auth.users where email = 'finu@nje.app'
on conflict (id) do update set username = excluded.username;

insert into public.profiles (id, username)
select id, 'shibu' from auth.users where email = 'shibu@nje.app'
on conflict (id) do update set username = excluded.username;
```

Adjust emails if yours differ. Users can also `insert` their own profile once if RLS allows (policy `profiles_insert_own`).

---

## Web Push (optional)

Without this, the app still has **in-app notifications** + **silent tab notifications** (`Notification` API when the tab is in the background). **Web Push** delivers the same titles when nje is fully closed, using the **production service worker** at **`/sw.js`** (generated by **vite-plugin-pwa** at build time). Push-specific handlers live in **`public/pwa-push-bridge.js`**, which the service worker loads via `importScripts` — edit that file if you need to change notification click behavior.

### 1. VAPID keys

Generate a key pair (install `web-push` globally, or use OpenSSL + base64 — the `web-push` CLI is easiest):

```bash
npx web-push generate-vapid-keys
```

- Put the **public** key in your Vite env as **`VITE_VAPID_PUBLIC_KEY`** (rebuild the app).
- You will use the **private** key only in Supabase Edge secrets (never in the browser).

### 2. Edge function `push-notify`

From the repo root (with [Supabase CLI](https://supabase.com/docs/guides/cli) linked to your project):

```bash
supabase functions deploy push-notify --no-verify-jwt
```

Set **Edge Function secrets** (Dashboard → Edge Functions → `push-notify` → Secrets, or CLI):

| Secret | Value |
|--------|--------|
| `NOTIFY_WEBHOOK_SECRET` | Long random string (you choose); must match the webhook header below |
| `VAPID_PUBLIC_KEY` | Same string as `VITE_VAPID_PUBLIC_KEY` |
| `VAPID_PRIVATE_KEY` | Private key from `web-push generate-vapid-keys` |
| `VAPID_SUBJECT` | Contact URI, e.g. `mailto:you@yourdomain.com` |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are usually provided automatically on hosted Supabase.

### 3. Database Webhook

In Supabase **Database → Webhooks** (or Integrations), create a webhook:

- **Table**: `public.notifications`
- **Events**: Insert
- **HTTP Request**: POST to your function URL, e.g. `https://<project-ref>.supabase.co/functions/v1/push-notify`
- **HTTP Headers**: add `x-webhook-secret: <same as NOTIFY_WEBHOOK_SECRET>`

The function checks that header, loads **`push_subscriptions`** for `record.user_id`, respects **per-kind** columns on **`notification_preferences`** (same rules as the rest of nje), and sends a silent payload to each subscription.

### 4. User flow

1. Run migration **`010_push_subscriptions.sql`**.
2. Deploy **`push-notify`** + secrets + webhook.
3. Users open **Settings → Notifications**, tap **Register this device** (after `VITE_VAPID_PUBLIC_KEY` is in the deployed build).

HTTPS and a supported browser are required for push (localhost is OK for development on most browsers).
