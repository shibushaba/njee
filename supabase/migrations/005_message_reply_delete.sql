-- Reply + soft delete (WhatsApp-style). Run after 003.
--
-- Supports both uuid and bigint primary keys on public.messages.id (some projects
-- use bigint; this repo's 001 uses uuid). reply_to_message_id and record_message_media_view
-- follow whatever type messages.id already has.

alter table public.messages
  add column if not exists deleted_at timestamptz null,
  add column if not exists reply_snippet text null,
  add column if not exists reply_message_type text null,
  add column if not exists reply_sender_id uuid null references auth.users (id) on delete set null;

-- reply_to_message_id must match messages.id type (uuid vs bigint).
do $reply_fk$
declare
  id_datatype text;
  reply_datatype text;
begin
  select c.data_type
  into id_datatype
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'messages'
    and c.column_name = 'id';

  if id_datatype is null then
    raise exception 'public.messages.id column not found';
  end if;

  if id_datatype not in ('uuid', 'bigint') then
    raise exception 'Unsupported public.messages.id type: % (expected uuid or bigint)', id_datatype;
  end if;

  select c.data_type
  into reply_datatype
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'messages'
    and c.column_name = 'reply_to_message_id';

  if reply_datatype is not null and reply_datatype = id_datatype then
    -- Already applied with correct type; keep data.
    return;
  end if;

  alter table public.messages drop constraint if exists messages_reply_to_message_id_fkey;

  if reply_datatype is not null then
    alter table public.messages drop column reply_to_message_id;
  end if;

  execute format(
    'alter table public.messages add column reply_to_message_id %s null references public.messages (id) on delete set null',
    id_datatype
  );
end;
$reply_fk$;

create index if not exists messages_reply_to_idx on public.messages (reply_to_message_id);
create index if not exists messages_deleted_at_idx on public.messages (deleted_at) where deleted_at is not null;

comment on column public.messages.deleted_at is 'When set, message is a tombstone shown as deleted to both participants.';
comment on column public.messages.reply_to_message_id is 'Optional message this row replies to.';
comment on column public.messages.reply_snippet is 'Denormalized preview text for the replied-to message.';
comment on column public.messages.reply_message_type is 'Message type of the replied-to row when sent.';
comment on column public.messages.reply_sender_id is 'Sender of the replied-to message when sent.';

-- Allow tombstone rows after soft delete (text, empty body, no media).
alter table public.messages drop constraint if exists messages_body_ck;

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
    deleted_at is not null
    and message_type = 'text'
    and media_url is null
    and media_type is null
    and char_length(trim(coalesce(content, ''))) between 0 and 4000
  )
);

-- Sender may update own rows (soft delete, future edits).
drop policy if exists "messages_update_sender" on public.messages;
create policy "messages_update_sender"
  on public.messages for update
  to authenticated
  using (auth.uid() = sender_id)
  with check (auth.uid() = sender_id);

-- Media view RPC: ignore deleted messages; parameter type matches messages.id.
do $rpc$
declare
  id_datatype text;
  mv_type text;
  fn_sql text;
begin
  select c.data_type
  into id_datatype
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'messages'
    and c.column_name = 'id';

  select mv.data_type
  into mv_type
  from information_schema.columns mv
  where mv.table_schema = 'public'
    and mv.table_name = 'message_views'
    and mv.column_name = 'message_id';

  if mv_type is not null and mv_type is distinct from id_datatype then
    raise exception
      'Type mismatch: public.messages.id is % but public.message_views.message_id is %. Fix message_views.message_id (or messages.id) so both match, then re-run this migration.',
      id_datatype,
      mv_type;
  end if;

  drop function if exists public.record_message_media_view(uuid);
  drop function if exists public.record_message_media_view(bigint);

  fn_sql := format(
    $def$
create or replace function public.record_message_media_view(p_message_id %s)
returns jsonb
language plpgsql
security definer
set search_path = public
as $body$
declare
  m public.messages%%rowtype;
  new_count int;
begin
  select * into m from public.messages where id = p_message_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if auth.uid() is distinct from m.sender_id and auth.uid() is distinct from m.receiver_id then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;

  if m.deleted_at is not null then
    return jsonb_build_object('ok', false, 'reason', 'deleted');
  end if;

  if m.message_type not in ('image', 'video') then
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
$body$;
$def$,
    id_datatype
  );

  execute fn_sql;

  execute format(
    'revoke all on function public.record_message_media_view(%s) from public',
    id_datatype
  );
  execute format(
    'grant execute on function public.record_message_media_view(%s) to authenticated',
    id_datatype
  );
end;
$rpc$;
