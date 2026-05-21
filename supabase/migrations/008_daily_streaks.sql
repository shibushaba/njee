-- Daily ritual streak for the two-person thread: both must send at least one message
-- (any non-deleted row) on the same calendar day (UTC). The streak is consecutive
-- completed days ending at the latest shared day, and is shown as 0 if that day is
-- older than "yesterday" UTC (a full day was missed).

-- Tear down first so re-runs fix a legacy/wrong `daily_streaks` shape. Without this,
-- `create table if not exists` is skipped and you can get: column "user_a" does not exist.
drop trigger if exists messages_refresh_daily_streak_ins on public.messages;
drop trigger if exists messages_refresh_daily_streak_upd on public.messages;
drop function if exists public.trg_messages_refresh_daily_streak();
drop function if exists public.refresh_daily_streak(uuid, uuid);
drop table if exists public.daily_streaks cascade;

create table public.daily_streaks (
  user_a uuid not null references auth.users (id) on delete cascade,
  user_b uuid not null references auth.users (id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_completed_date date null,
  updated_at timestamptz not null default now(),
  constraint daily_streaks_ordered_pair check (user_a < user_b),
  primary key (user_a, user_b)
);

create index if not exists daily_streaks_updated_at_idx on public.daily_streaks (updated_at desc);

alter table public.daily_streaks enable row level security;

create policy "daily_streaks_select_participants"
  on public.daily_streaks for select
  to authenticated
  using (auth.uid() = user_a or auth.uid() = user_b);

comment on table public.daily_streaks is 'Pair ritual streak; rows upserted by refresh_daily_streak() from message activity.';

create or replace function public.refresh_daily_streak(p1 uuid, p2 uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  a uuid := least(p1, p2);
  b uuid := greatest(p1, p2);
  new_streak int;
  max_d date;
begin
  if a is null or b is null or a = b then
    return;
  end if;

  with recursive dual as (
    select (timezone('UTC', m.created_at))::date as d
    from public.messages m
    where m.deleted_at is null
      and least(m.sender_id, m.receiver_id) = a
      and greatest(m.sender_id, m.receiver_id) = b
    group by 1
    having count(distinct m.sender_id) = 2
  ),
  mx as (select max(d) as max_d from dual),
  gates as (
    select
      mx.max_d,
      case
        when mx.max_d is null then false
        when mx.max_d < ((timezone('UTC', now()))::date - 1) then false
        else true
      end as ok
    from mx
  ),
  chain as (
    select mx.max_d as d, 1 as n
    from mx
    cross join gates
    where gates.ok and mx.max_d is not null
    union all
    select c.d - 1, c.n + 1
    from chain c
    inner join dual on dual.d = c.d - 1
  ),
  sc as (select coalesce(max(n), 0) as streak from chain)
  select sc.streak, mx.max_d into new_streak, max_d
  from sc
  cross join mx;

  insert into public.daily_streaks (user_a, user_b, current_streak, longest_streak, last_completed_date, updated_at)
  values (a, b, new_streak, new_streak, max_d, now())
  on conflict (user_a, user_b) do update set
    current_streak = excluded.current_streak,
    longest_streak = greatest(public.daily_streaks.longest_streak, excluded.current_streak),
    last_completed_date = excluded.last_completed_date,
    updated_at = now();
end;
$$;

create or replace function public.trg_messages_refresh_daily_streak()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_daily_streak(new.sender_id, new.receiver_id);
  return new;
end;
$$;

drop trigger if exists messages_refresh_daily_streak_ins on public.messages;
create trigger messages_refresh_daily_streak_ins
  after insert on public.messages
  for each row
  execute function public.trg_messages_refresh_daily_streak();

drop trigger if exists messages_refresh_daily_streak_upd on public.messages;
create trigger messages_refresh_daily_streak_upd
  after update of deleted_at on public.messages
  for each row
  when (old.deleted_at is distinct from new.deleted_at)
  execute function public.trg_messages_refresh_daily_streak();

do $migration$
declare
  r record;
begin
  for r in
    select distinct least(sender_id, receiver_id) as ua, greatest(sender_id, receiver_id) as ub
    from public.messages
    where deleted_at is null
  loop
    perform public.refresh_daily_streak(r.ua, r.ub);
  end loop;
end;
$migration$;

do $migration$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      execute 'alter publication supabase_realtime add table public.daily_streaks';
    exception
      when duplicate_object then
        null;
    end;
  end if;
end;
$migration$;
