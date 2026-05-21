-- Fix Web Push registration when `push_subscriptions` already has this `endpoint`
-- for another user (or stale row): plain client upsert hits RLS on UPDATE (USING).

create or replace function public.save_my_push_subscription(p_endpoint text, p_subscription jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_endpoint is null or length(trim(p_endpoint)) = 0 then
    raise exception 'endpoint required';
  end if;

  delete from public.push_subscriptions where endpoint = p_endpoint;

  insert into public.push_subscriptions (user_id, endpoint, subscription, updated_at)
  values (auth.uid(), p_endpoint, p_subscription, now());
end;
$$;

comment on function public.save_my_push_subscription(text, jsonb) is
  'Replace any row sharing this browser endpoint, then insert for auth.uid(); avoids RLS failure on upsert when endpoint was owned by another user.';

revoke all on function public.save_my_push_subscription(text, jsonb) from public;
grant execute on function public.save_my_push_subscription(text, jsonb) to authenticated;
