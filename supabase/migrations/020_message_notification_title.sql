-- Use "message" wording for text notification titles (was "note").

create or replace function public.trg_messages_notify_recipient()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  k text;
  t text;
  b text;
  lim int := 160;
begin
  if tg_op <> 'INSERT' then
    return new;
  end if;
  if new.deleted_at is not null then
    return new;
  end if;
  if new.sender_id = new.receiver_id then
    return new;
  end if;

  if new.message_type = 'text' then
    k := 'message';
    t := 'A new message';
    b := left(trim(new.content), lim);
    if char_length(b) = 0 then
      b := 'Something gentle arrived.';
    end if;
  else
    k := 'media';
    t := 'A new moment';
    b := 'Photo or video shared — open when you are ready.';
  end if;

  perform public.notifications_insert_for_user(
    new.receiver_id,
    k,
    t,
    b,
    new.sender_id,
    new.id::text,
    jsonb_build_object('message_type', new.message_type)
  );
  return new;
end;
$$;
