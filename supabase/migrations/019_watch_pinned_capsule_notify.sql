-- In-app + webhook notifications for pinned moments, watch shelf activity, and new time capsules.
-- Run after watch portal migrations (017/018) so `watch_items.recipient_id` exists for shelf triggers.

-- --- Preferences (defaults on for existing rows) ---
alter table public.notification_preferences
  add column if not exists notify_pinned_moment boolean not null default true;

alter table public.notification_preferences
  add column if not exists notify_watch_shelf boolean not null default true;

comment on column public.notification_preferences.notify_pinned_moment is 'When the other person pins a thread moment.';
comment on column public.notification_preferences.notify_watch_shelf is 'Suggestions + watch progress on the shared shelf.';

-- --- Allow new notification kinds ---
alter table public.notifications drop constraint if exists notifications_kind_check;

alter table public.notifications
  add constraint notifications_kind_check check (
    kind in (
      'message',
      'media',
      'streak',
      'time_capsule',
      'shared_collection',
      'presence',
      'pinned_moment',
      'watch_shelf'
    )
  );

-- --- Preference helper (SECURITY DEFINER) ---
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
        when 'pinned_moment' then p.notify_pinned_moment
        when 'watch_shelf' then p.notify_watch_shelf
        else true
      end
      from public.notification_preferences p
      where p.user_id = p_user
    ),
    true
  );
$$;

-- --- Pinned moments → peer in the message thread ---
create or replace function public.trg_pinned_moments_notify_peer()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  sid uuid;
  rid uuid;
  target uuid;
  lim int := 160;
  snippet text;
begin
  if tg_op <> 'INSERT' then
    return new;
  end if;

  select m.sender_id, m.receiver_id
  into sid, rid
  from public.messages m
  where m.id = new.message_id;

  if sid is null or rid is null then
    return new;
  end if;

  if new.pinned_by = sid then
    target := rid;
  elsif new.pinned_by = rid then
    target := sid;
  else
    return new;
  end if;

  snippet := coalesce(nullif(trim(new.context_label), ''), 'Open Moments to see it.');
  if char_length(snippet) > lim then
    snippet := left(snippet, lim) || '…';
  end if;

  perform public.notifications_insert_for_user(
    target,
    'pinned_moment',
    'A moment was pinned',
    snippet,
    new.pinned_by,
    null,
    jsonb_build_object(
      'pinned_moment_id',
      new.id,
      'pair_key',
      new.pair_key,
      'message_id',
      new.message_id
    )
  );

  return new;
end;
$$;

drop trigger if exists pinned_moments_notify_peer_ins on public.pinned_moments;
create trigger pinned_moments_notify_peer_ins
  after insert on public.pinned_moments
  for each row
  execute function public.trg_pinned_moments_notify_peer();

-- --- New time capsule (vault) → receiver ---
create or replace function public.trg_time_capsules_notify_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  t text;
  b text;
  lim int := 200;
begin
  if tg_op <> 'INSERT' then
    return new;
  end if;

  t := coalesce(nullif(trim(new.capsule_title), ''), 'A sealed moment');
  b := format(
    'Unlocks %s.',
    to_char(new.unlock_at at time zone 'UTC', 'Mon DD, YYYY')
  );
  if char_length(b) > lim then
    b := left(b, lim) || '…';
  end if;

  perform public.notifications_insert_for_user(
    new.receiver_id,
    'time_capsule',
    'Something is waiting in the vault',
    b,
    new.sender_id,
    null,
    jsonb_build_object('time_capsule_id', new.id, 'pair_key', new.pair_key, 'event', 'created')
  );

  return new;
end;
$$;

drop trigger if exists time_capsules_notify_created_ins on public.time_capsules;
create trigger time_capsules_notify_created_ins
  after insert on public.time_capsules
  for each row
  execute function public.trg_time_capsules_notify_created();

-- --- Watch shelf (requires portal columns) ---
create or replace function public.trg_watch_items_notify()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  lim int := 160;
  title text;
  has_portal boolean;
begin
  select exists (
    select 1
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = 'watch_items'
      and c.column_name = 'recipient_id'
  )
  into has_portal;

  if not has_portal then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.recipient_id is null then
      return new;
    end if;
    title := left(trim(new.title), lim);
    if char_length(title) = 0 then
      title := 'A new suggestion';
    end if;
    perform public.notifications_insert_for_user(
      new.recipient_id,
      'watch_shelf',
      'New suggestion',
      title,
      new.added_by,
      null,
      jsonb_build_object('watch_item_id', new.id, 'pair_key', new.pair_key, 'event', 'insert')
    );
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.recipient_id is null then
      return new;
    end if;

    title := left(trim(new.title), lim);
    if char_length(title) = 0 then
      title := 'Watch shelf';
    end if;

    if (old.status is distinct from new.status)
      or (old.watched_at is distinct from new.watched_at)
      or (old.stars_watch is distinct from new.stars_watch)
      or (old.abi is distinct from new.abi)
    then
      perform public.notifications_insert_for_user(
        new.added_by,
        'watch_shelf',
        case new.status
          when 'watched' then 'They watched your pick'
          when 'watching' then 'They started watching'
          else 'Suggestion updated'
        end,
        title,
        new.recipient_id,
        null,
        jsonb_build_object('watch_item_id', new.id, 'pair_key', new.pair_key, 'event', 'progress')
      );
    elsif (old.title is distinct from new.title)
      or (old.notes is distinct from new.notes)
      or (
        exists (
          select 1 from information_schema.columns c
          where c.table_schema = 'public' and c.table_name = 'watch_items' and c.column_name = 'priority'
        )
        and (old.priority is distinct from new.priority)
      )
      or (
        exists (
          select 1 from information_schema.columns c
          where c.table_schema = 'public' and c.table_name = 'watch_items' and c.column_name = 'suggest_stars'
        )
        and (old.suggest_stars is distinct from new.suggest_stars)
      )
    then
      perform public.notifications_insert_for_user(
        new.recipient_id,
        'watch_shelf',
        'Suggestion was updated',
        title,
        new.added_by,
        null,
        jsonb_build_object('watch_item_id', new.id, 'pair_key', new.pair_key, 'event', 'edit')
      );
    end if;

    return new;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists watch_items_notify_ins on public.watch_items;
drop trigger if exists watch_items_notify_upd on public.watch_items;

create trigger watch_items_notify_ins
  after insert on public.watch_items
  for each row
  execute function public.trg_watch_items_notify();

create trigger watch_items_notify_upd
  after update on public.watch_items
  for each row
  execute function public.trg_watch_items_notify();
