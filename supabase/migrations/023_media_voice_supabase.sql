-- Voice memories + Supabase Storage audio; view-once RPC includes voice.
-- messages_body_ck must stay compatible with 005 (tombstones) and 007 (cleared media paths).

alter table public.messages drop constraint if exists messages_type_allowed;
alter table public.messages drop constraint if exists messages_media_type_allowed;
alter table public.messages drop constraint if exists messages_body_ck;

-- Rows that lost Storage/Drive blobs but kept message_type (view-once / expiry purge).
update public.messages
set is_locked = true
where deleted_at is null
  and message_type in ('image', 'video')
  and media_url is null
  and media_type is null
  and not coalesce(is_locked, false);

-- Legacy soft-deletes that still have media message_type (app now normalizes to text tombstone).
update public.messages
set
  message_type = 'text',
  media_url = null,
  media_type = null,
  content = coalesce(nullif(trim(content), ''), ''),
  view_limit = null,
  current_views = 0,
  is_locked = false
where deleted_at is not null
  and message_type <> 'text';

-- Active text rows with empty body (invalid for messages_body_ck).
update public.messages
set content = '.'
where deleted_at is null
  and message_type = 'text'
  and media_url is null
  and char_length(trim(coalesce(content, ''))) < 1;

alter table public.messages add constraint messages_type_allowed
  check (message_type in ('text', 'image', 'video', 'voice'));

alter table public.messages add constraint messages_media_type_allowed
  check (media_type is null or media_type in ('image', 'video', 'voice'));

alter table public.messages add constraint messages_body_ck check (
  (
    deleted_at is null
    and message_type = 'text'
    and media_url is null
    and char_length(trim(content)) between 1 and 4000
  )
  or (
    deleted_at is null
    and message_type = 'image'
    and media_url is not null
    and media_type = 'image'
    and char_length(trim(coalesce(content, ''))) <= 4000
  )
  or (
    deleted_at is null
    and message_type = 'video'
    and media_url is not null
    and media_type = 'video'
    and char_length(trim(coalesce(content, ''))) <= 4000
  )
  or (
    deleted_at is null
    and message_type = 'voice'
    and media_url is not null
    and media_type = 'voice'
    and char_length(trim(coalesce(content, ''))) <= 4000
  )
  or (
    deleted_at is null
    and message_type in ('image', 'video', 'voice')
    and media_url is null
    and media_type is null
    and is_locked = true
    and char_length(trim(coalesce(content, ''))) <= 4000
  )
  or (
    deleted_at is not null
    and message_type = 'text'
    and media_url is null
    and media_type is null
    and char_length(trim(coalesce(content, ''))) between 0 and 4000
  )
);

update storage.buckets
set allowed_mime_types = array[
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/webm', 'video/quicktime',
  'audio/mpeg', 'audio/mp4', 'audio/webm', 'audio/ogg', 'audio/wav', 'audio/aac', 'audio/x-m4a', 'audio/mp3'
]::text[]
where id = 'media';

create or replace function public.record_message_media_view(p_message_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.messages%rowtype;
  new_count int;
begin
  select * into m from public.messages where id = p_message_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if auth.uid() is distinct from m.sender_id and auth.uid() is distinct from m.receiver_id then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;

  if m.message_type not in ('image', 'video', 'voice') then
    return jsonb_build_object('ok', false, 'reason', 'not_media');
  end if;

  if m.is_locked then
    return jsonb_build_object('ok', false, 'locked', true);
  end if;

  if m.view_limit is null then
    return jsonb_build_object('ok', true, 'locked', false, 'unlimited', true);
  end if;

  if m.current_views >= m.view_limit then
    update public.messages set is_locked = true where id = p_message_id;
    return jsonb_build_object('ok', false, 'locked', true);
  end if;

  insert into public.message_views (message_id, viewer_id)
  values (p_message_id, auth.uid());

  new_count := m.current_views + 1;

  update public.messages
  set
    current_views = new_count,
    is_locked = (new_count >= m.view_limit)
  where id = p_message_id;

  return jsonb_build_object(
    'ok', true,
    'locked', new_count >= m.view_limit,
    'current_views', new_count,
    'unlimited', false
  );
end;
$$;

revoke all on function public.record_message_media_view(uuid) from public;
grant execute on function public.record_message_media_view(uuid) to authenticated;
