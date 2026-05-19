# Supabase: nje chat

1. Run `migrations/001_messages_and_profiles.sql` in the Supabase SQL editor.
2. Run `migrations/002_media_storage.sql` for **private media** (`storage` bucket `media`) and message columns `media_url`, `media_type`, `view_limit`, `current_views`.
3. Run `migrations/003_disappearing_media.sql` for **`is_locked`**, **`message_views`**, and RPC **`record_message_media_view`** (replaces `increment_message_media_views`).
4. Run `migrations/004_realtime_messages.sql` so **`messages`** is part of the **`supabase_realtime`** publication (instant `current_views` / `is_locked` sync). If it errors because the table is already published, you can skip it.
5. Run `migrations/005_message_reply_delete.sql` for **reply metadata**, **soft delete** (`deleted_at`), sender **update** policy, and **`record_message_media_view`** guard on deleted rows.
6. **Profiles:** insert one row per auth user so the app can resolve the peer (two users only):

```sql
insert into public.profiles (id, username)
select id, 'finu' from auth.users where email = 'finu@nje.app'
on conflict (id) do update set username = excluded.username;

insert into public.profiles (id, username)
select id, 'shibu' from auth.users where email = 'shibu@nje.app'
on conflict (id) do update set username = excluded.username;
```

Adjust emails if yours differ. Users can also `insert` their own profile once if RLS allows (policy `profiles_insert_own`).
