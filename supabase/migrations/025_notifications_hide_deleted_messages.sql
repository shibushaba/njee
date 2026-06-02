-- Drop inbox pings when a message is soft-deleted; hide deleted refs from unread count.

delete from public.notifications n
using public.messages m
where n.ref_message_id = m.id
  and m.deleted_at is not null;

create or replace function public.trg_messages_purge_notifications_on_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and new.deleted_at is not null
     and (old.deleted_at is null) then
    delete from public.notifications
    where ref_message_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists messages_purge_notifications_on_soft_del on public.messages;
create trigger messages_purge_notifications_on_soft_del
  after update of deleted_at on public.messages
  for each row
  when (old.deleted_at is distinct from new.deleted_at)
  execute function public.trg_messages_purge_notifications_on_delete();

create or replace function public.count_unread_notifications(p_user uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.notifications n
  left join public.messages m on m.id = n.ref_message_id
  where n.user_id = p_user
    and n.read_at is null
    and (n.ref_message_id is null or m.deleted_at is null);
$$;

revoke all on function public.count_unread_notifications(uuid) from public;
grant execute on function public.count_unread_notifications(uuid) to authenticated;
