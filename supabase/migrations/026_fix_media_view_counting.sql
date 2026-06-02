-- Reliable once/twice counting: restore deleted guard + explicit grants (023 omitted grant).

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

  if m.message_type not in ('image', 'video', 'voice') then
    return jsonb_build_object('ok', false, 'reason', 'not_media');
  end if;

  if m.is_locked then
    return jsonb_build_object('ok', false, 'locked', true, 'unlimited', false);
  end if;

  if m.view_limit is null or m.view_limit <= 0 then
    return jsonb_build_object('ok', true, 'locked', false, 'unlimited', true);
  end if;

  if m.current_views >= m.view_limit then
    update public.messages set is_locked = true where id = p_message_id;
    return jsonb_build_object('ok', false, 'locked', true, 'unlimited', false);
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
