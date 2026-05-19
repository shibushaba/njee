-- After a limited media message is locked, clients delete the Drive file then call this
-- to drop media_url / media_type so the row no longer references storage.

create or replace function public.clear_locked_media_path(p_message_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  update public.messages
  set
    media_url = null,
    media_type = null
  where id = p_message_id
    and is_locked = true
    and view_limit is not null
    and view_limit > 0
    and media_url is not null
    and (auth.uid() = sender_id or auth.uid() = receiver_id);

  get diagnostics n = row_count;
  return jsonb_build_object('ok', n > 0);
end;
$$;

revoke all on function public.clear_locked_media_path(uuid) from public;
grant execute on function public.clear_locked_media_path(uuid) to authenticated;
