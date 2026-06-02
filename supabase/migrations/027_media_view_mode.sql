-- Persist once / twice / keep on the row so view limits survive even if view_limit column was null.

alter table public.messages
  add column if not exists media_view_mode text null;

alter table public.messages drop constraint if exists messages_media_view_mode_ck;
alter table public.messages add constraint messages_media_view_mode_ck
  check (media_view_mode is null or media_view_mode in ('once', 'twice', 'keep'));

comment on column public.messages.media_view_mode is 'once | twice | keep (chat media). Drives client + RPC view counting.';

-- Best-effort backfill for chat media missing mode but having a limit.
update public.messages
set media_view_mode = 'once'
where media_view_mode is null
  and view_limit = 1
  and message_type in ('image', 'video', 'voice');

update public.messages
set media_view_mode = 'twice'
where media_view_mode is null
  and view_limit = 2
  and message_type in ('image', 'video', 'voice');

update public.messages
set media_view_mode = 'keep'
where media_view_mode is null
  and view_limit is null
  and media_expires_at is not null
  and message_type in ('image', 'video', 'voice');

create or replace function public.record_message_media_view(p_message_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.messages%rowtype;
  new_count int;
  lim int;
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

  if m.message_type not in ('image', 'video', 'voice') then
    return jsonb_build_object('ok', false, 'reason', 'not_media');
  end if;

  if m.is_locked then
    return jsonb_build_object('ok', false, 'locked', true, 'unlimited', false);
  end if;

  lim := m.view_limit;
  if m.media_view_mode = 'once' then
    lim := 1;
  elsif m.media_view_mode = 'twice' then
    lim := 2;
  elsif m.media_view_mode = 'keep' then
    lim := null;
  end if;

  if lim is null or lim <= 0 then
    return jsonb_build_object('ok', true, 'locked', false, 'unlimited', true);
  end if;

  if m.view_limit is distinct from lim then
    update public.messages set view_limit = lim where id = p_message_id;
  end if;

  if m.current_views >= lim then
    update public.messages set is_locked = true where id = p_message_id;
    return jsonb_build_object('ok', false, 'locked', true, 'unlimited', false);
  end if;

  insert into public.message_views (message_id, viewer_id)
  values (p_message_id, auth.uid());

  new_count := m.current_views + 1;

  update public.messages
  set
    current_views = new_count,
    is_locked = (new_count >= lim)
  where id = p_message_id;

  return jsonb_build_object(
    'ok', true,
    'locked', new_count >= lim,
    'current_views', new_count,
    'unlimited', false
  );
end;
$$;

revoke all on function public.record_message_media_view(uuid) from public;
grant execute on function public.record_message_media_view(uuid) to authenticated;
