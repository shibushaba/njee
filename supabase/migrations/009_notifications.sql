-- Calm in-app notification feed + preferences (two-user thread).
-- Triggers: new messages/media → recipient; streak increase → both participants.

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  notify_message boolean not null default true,
  notify_media boolean not null default true,
  notify_streak boolean not null default true,
  notify_time_capsule boolean not null default true,
  notify_shared_collection boolean not null default true,
  notify_presence boolean not null default false,
  browser_push boolean not null default false,
  updated_at timestamptz not null default now()
);

comment on table public.notification_preferences is 'Per-user toggles; browser_push reserved for future PWA web push.';

alter table public.notification_preferences enable row level security;

create policy "notification_preferences_select_own"
  on public.notification_preferences for select
  to authenticated
  using (auth.uid() = user_id);

create policy "notification_preferences_insert_own"
  on public.notification_preferences for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "notification_preferences_update_own"
  on public.notification_preferences for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- notifications: ref_message_id must match public.messages.id (uuid vs bigint; see 005).
drop trigger if exists messages_notify_recipient_ins on public.messages;
drop trigger if exists daily_streaks_notify_ins on public.daily_streaks;
drop trigger if exists daily_streaks_notify_upd on public.daily_streaks;
drop function if exists public.trg_messages_notify_recipient() cascade;
drop function if exists public.trg_daily_streaks_notify_pair() cascade;
drop function if exists public.notifications_insert_for_user(uuid, text, text, text, uuid, uuid, jsonb) cascade;
drop function if exists public.notifications_insert_for_user(uuid, text, text, text, uuid, text, jsonb) cascade;
drop table if exists public.notifications cascade;

do $notif_table$
declare
  mid text;
begin
  select c.data_type
  into strict mid
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'messages'
    and c.column_name = 'id';

  if mid not in ('uuid', 'bigint') then
    raise exception 'public.messages.id must be uuid or bigint (found %)', mid;
  end if;

  execute format(
    $sql$
    create table public.notifications (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references auth.users (id) on delete cascade,
      kind text not null check (
        kind in (
          'message',
          'media',
          'streak',
          'time_capsule',
          'shared_collection',
          'presence'
        )
      ),
      title text not null,
      body text not null default '',
      actor_id uuid null references auth.users (id) on delete set null,
      ref_message_id %s null references public.messages (id) on delete cascade,
      meta jsonb not null default '{}'::jsonb,
      read_at timestamptz null,
      created_at timestamptz not null default now()
    );
    $sql$,
    mid
  );
end;
$notif_table$;

comment on table public.notifications is 'Recipient inbox; kinds time_capsule / shared_collection / presence reserved for future features.';

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id)
  where read_at is null;

create unique index if not exists notifications_one_per_message
  on public.notifications (user_id, ref_message_id)
  where ref_message_id is not null;

alter table public.notifications enable row level security;

create policy "notifications_select_own"
  on public.notifications for select
  to authenticated
  using (auth.uid() = user_id);

create policy "notifications_update_own"
  on public.notifications for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- --- Internal helpers (triggers only; SECURITY DEFINER) ---

create or replace function public.notifications_pref_allows(p_user uuid, p_kind text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select case p_kind
        when 'message' then p.notify_message
        when 'media' then p.notify_media
        when 'streak' then p.notify_streak
        when 'time_capsule' then p.notify_time_capsule
        when 'shared_collection' then p.notify_shared_collection
        when 'presence' then p.notify_presence
        else true
      end
      from public.notification_preferences p
      where p.user_id = p_user
    ),
    true
  );
$$;

create or replace function public.notifications_insert_for_user(
  p_user uuid,
  p_kind text,
  p_title text,
  p_body text,
  p_actor uuid,
  p_ref_message text,
  p_meta jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  mid text;
begin
  if p_user is null then
    return;
  end if;
  if not public.notifications_pref_allows(p_user, p_kind) then
    return;
  end if;

  select c.data_type
  into strict mid
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'messages'
    and c.column_name = 'id';

  if p_ref_message is not null then
    if mid = 'uuid' then
      insert into public.notifications (user_id, kind, title, body, actor_id, ref_message_id, meta)
      values (p_user, p_kind, p_title, coalesce(p_body, ''), p_actor, p_ref_message::uuid, coalesce(p_meta, '{}'::jsonb))
      on conflict (user_id, ref_message_id) where (ref_message_id is not null) do nothing;
    elsif mid = 'bigint' then
      insert into public.notifications (user_id, kind, title, body, actor_id, ref_message_id, meta)
      values (p_user, p_kind, p_title, coalesce(p_body, ''), p_actor, p_ref_message::bigint, coalesce(p_meta, '{}'::jsonb))
      on conflict (user_id, ref_message_id) where (ref_message_id is not null) do nothing;
    else
      raise exception 'public.messages.id unsupported type: %', mid;
    end if;
  else
    insert into public.notifications (user_id, kind, title, body, actor_id, ref_message_id, meta)
    values (p_user, p_kind, p_title, coalesce(p_body, ''), p_actor, null, coalesce(p_meta, '{}'::jsonb));
  end if;
end;
$$;

comment on function public.notifications_insert_for_user is 'Insert one inbox row respecting preferences; dedupes per (user, message). p_ref_message is text form of messages.id (uuid or bigint).';

create or replace function public.trg_messages_notify_recipient()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  k text;
  t text;
  b text;
  lim int := 160;
begin
  if tg_op <> 'INSERT' then
    return new;
  end if;
  if new.deleted_at is not null then
    return new;
  end if;
  if new.sender_id = new.receiver_id then
    return new;
  end if;

  if new.message_type = 'text' then
    k := 'message';
    t := 'A new note';
    b := left(trim(new.content), lim);
    if char_length(b) = 0 then
      b := 'Something gentle arrived.';
    end if;
  else
    k := 'media';
    t := 'A new moment';
    b := 'Photo or video shared — open when you are ready.';
  end if;

  perform public.notifications_insert_for_user(
    new.receiver_id,
    k,
    t,
    b,
    new.sender_id,
    new.id::text,
    jsonb_build_object('message_type', new.message_type)
  );
  return new;
end;
$$;

drop trigger if exists messages_notify_recipient_ins on public.messages;
create trigger messages_notify_recipient_ins
  after insert on public.messages
  for each row
  execute function public.trg_messages_notify_recipient();

create or replace function public.trg_daily_streaks_notify_pair()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  bump boolean := false;
  n int;
  t text;
  b text;
begin
  if tg_op = 'INSERT' then
    bump := new.current_streak > 0;
  elsif tg_op = 'UPDATE' then
    bump := new.current_streak is distinct from old.current_streak
      and new.current_streak > coalesce(old.current_streak, 0);
  else
    return new;
  end if;

  if not bump then
    return new;
  end if;

  n := new.current_streak;
  t := 'Shared ritual';
  b := format('Your quiet streak together is now %s day%s.', n, case when n = 1 then '' else 's' end);

  perform public.notifications_insert_for_user(new.user_a, 'streak', t, b, null, null, jsonb_build_object('current_streak', n));
  perform public.notifications_insert_for_user(new.user_b, 'streak', t, b, null, null, jsonb_build_object('current_streak', n));
  return new;
end;
$$;

drop trigger if exists daily_streaks_notify_ins on public.daily_streaks;
create trigger daily_streaks_notify_ins
  after insert on public.daily_streaks
  for each row
  execute function public.trg_daily_streaks_notify_pair();

drop trigger if exists daily_streaks_notify_upd on public.daily_streaks;
create trigger daily_streaks_notify_upd
  after update of current_streak on public.daily_streaks
  for each row
  execute function public.trg_daily_streaks_notify_pair();

do $migration$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      execute 'alter publication supabase_realtime add table public.notifications';
    exception
      when duplicate_object then
        null;
    end;
    begin
      execute 'alter publication supabase_realtime add table public.notification_preferences';
    exception
      when duplicate_object then
        null;
    end;
  end if;
end;
$migration$;
