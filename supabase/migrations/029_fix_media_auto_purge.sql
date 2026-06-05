-- Auto-purge: Keep/voice expiry + once/twice via media_view_mode / message_views (not just view_limit + is_locked).

create or replace function public.clear_locked_media_path(p_message_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  m public.messages%rowtype;
  lim int;
  receiver_views int;
  eligible boolean := false;
  n int;
begin
  select * into m from public.messages where id = p_message_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if auth.uid() is distinct from m.sender_id and auth.uid() is distinct from m.receiver_id then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;

  if m.media_url is null then
    return jsonb_build_object('ok', true, 'reason', 'already_cleared');
  end if;

  lim := m.view_limit;
  if m.media_view_mode = 'once' then
    lim := 1;
  elsif m.media_view_mode = 'twice' then
    lim := 2;
  elsif m.media_view_mode = 'keep' then
    lim := null;
  end if;

  select count(*)::int into receiver_views
  from public.message_views
  where message_id = p_message_id and viewer_id = m.receiver_id;

  if m.media_expires_at is not null and m.media_expires_at <= now() then
    eligible := true;
  elsif lim is not null and lim > 0 and (
    m.is_locked or m.current_views >= lim or receiver_views >= lim
  ) then
    eligible := true;
    update public.messages
    set
      view_limit = coalesce(lim, view_limit),
      current_views = greatest(m.current_views, receiver_views),
      is_locked = true
    where id = p_message_id;
    select * into m from public.messages where id = p_message_id;
  end if;

  if not eligible then
    return jsonb_build_object('ok', false, 'reason', 'not_eligible');
  end if;

  update public.messages
  set
    media_url = null,
    media_type = null,
    is_locked = true,
    media_expires_at = null,
    view_limit = coalesce(lim, m.view_limit),
    current_views = case
      when lim is not null and lim > 0 then greatest(m.current_views, receiver_views)
      else m.current_views
    end
  where id = p_message_id;

  get diagnostics n = row_count;
  return jsonb_build_object('ok', n > 0);
end;
$$;

revoke all on function public.clear_locked_media_path(uuid) from public;
grant execute on function public.clear_locked_media_path(uuid) to authenticated;
