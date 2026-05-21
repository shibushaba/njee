-- Soft inbox entries when a time capsule crosses into "open" (both participants).

create or replace function public.trg_time_capsules_notify_unlocked()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  t text;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;
  if coalesce(old.is_unlocked, false) = true then
    return new;
  end if;
  if new.is_unlocked is distinct from true then
    return new;
  end if;

  t := coalesce(nullif(trim(new.capsule_title), ''), 'A sealed moment');

  perform public.notifications_insert_for_user(
    new.receiver_id,
    'time_capsule',
    'Something waited for you',
    'A capsule meant for you has quietly opened.',
    new.sender_id,
    null,
    jsonb_build_object('time_capsule_id', new.id, 'pair_key', new.pair_key)
  );

  perform public.notifications_insert_for_user(
    new.sender_id,
    'time_capsule',
    'What you sealed is open',
    format('%s can be read now.', t),
    new.receiver_id,
    null,
    jsonb_build_object('time_capsule_id', new.id, 'pair_key', new.pair_key)
  );

  return new;
end;
$$;

comment on function public.trg_time_capsules_notify_unlocked is 'After is_unlocked flips true, notify sender and receiver (respects notification_preferences).';

drop trigger if exists time_capsules_notify_unlock_upd on public.time_capsules;
create trigger time_capsules_notify_unlock_upd
  after update of is_unlocked on public.time_capsules
  for each row
  execute function public.trg_time_capsules_notify_unlocked();
