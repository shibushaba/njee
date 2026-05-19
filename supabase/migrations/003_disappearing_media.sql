-- Disappearing media: per-open tracking, lock flag, message_views audit table.

alter table public.messages
  add column if not exists is_locked boolean not null default false;

-- Backfill lock state for existing limited media
update public.messages
set is_locked = true
where message_type in ('image', 'video')
  and view_limit is not null
  and view_limit > 0
  and current_views >= view_limit;

create table if not exists public.message_views (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages (id) on delete cascade,
  viewer_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists message_views_message_id_idx on public.message_views (message_id);
create index if not exists message_views_viewer_idx on public.message_views (viewer_id);

alter table public.message_views enable row level security;

-- Participants can see view rows for their thread messages (optional analytics / future UI)
drop policy if exists "message_views_select_participant" on public.message_views;
create policy "message_views_select_participant"
  on public.message_views for select
  to authenticated
  using (
    exists (
      select 1
      from public.messages msg
      where msg.id = message_views.message_id
        and (msg.sender_id = auth.uid() or msg.receiver_id = auth.uid())
    )
  );

revoke all on public.message_views from public;
revoke all on public.message_views from anon;
grant select on public.message_views to authenticated;

comment on table public.message_views is 'One row per counted fullscreen open for limited media.';
comment on column public.messages.is_locked is 'When true, clients should not fetch or open media.';

-- Replace legacy increment with atomic record + lock
drop function if exists public.increment_message_media_views(uuid);

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

revoke all on function public.record_message_media_view(uuid) from public;
grant execute on function public.record_message_media_view(uuid) to authenticated;
