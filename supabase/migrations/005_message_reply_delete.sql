-- Reply + soft delete (WhatsApp-style). Run after 003.

alter table public.messages
  add column if not exists deleted_at timestamptz null,
  add column if not exists reply_to_message_id uuid null references public.messages (id) on delete set null,
  add column if not exists reply_snippet text null,
  add column if not exists reply_message_type text null,
  add column if not exists reply_sender_id uuid null references auth.users (id) on delete set null;

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

-- Media view RPC: ignore deleted messages.
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
$$;
