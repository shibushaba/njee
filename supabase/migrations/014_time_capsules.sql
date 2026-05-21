-- Future-unlock messages for the 1:1 thread (text + optional media ref).

create table if not exists public.time_capsules (
  id uuid primary key default gen_random_uuid(),
  pair_key text not null,
  sender_id uuid not null references auth.users (id) on delete cascade,
  receiver_id uuid not null references auth.users (id) on delete cascade,
  capsule_title text null,
  content text not null default '',
  capsule_type text not null default 'text',
  media_url text null,
  media_type text null,
  unlock_at timestamptz not null,
  is_unlocked boolean not null default false,
  unlocked_at timestamptz null,
  created_at timestamptz not null default now(),
  context_label text null,
  constraint time_capsules_no_self check (sender_id <> receiver_id),
  constraint time_capsules_type_ck check (capsule_type in ('text', 'image', 'video', 'voice')),
  constraint time_capsules_media_type_ck check (media_type is null or media_type in ('image', 'video')),
  constraint time_capsules_payload_ck check (char_length(trim(content)) > 0 or media_url is not null),
  constraint time_capsules_title_len check (capsule_title is null or char_length(capsule_title) <= 200),
  constraint time_capsules_context_len check (context_label is null or char_length(context_label) <= 64)
);

create index if not exists time_capsules_pair_unlock
  on public.time_capsules (pair_key, unlock_at desc);

create index if not exists time_capsules_pair_created
  on public.time_capsules (pair_key, created_at desc);

comment on table public.time_capsules is 'Messages/media that unlock at unlock_at; synced between two users.';
comment on column public.time_capsules.is_unlocked is 'Set true when unlock_at reached (client or batch update).';

alter table public.time_capsules enable row level security;

create policy "time_capsules_select_participant"
  on public.time_capsules for select
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "time_capsules_insert_sender"
  on public.time_capsules for insert
  to authenticated
  with check (auth.uid() = sender_id);

create policy "time_capsules_update_participant"
  on public.time_capsules for update
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id)
  with check (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "time_capsules_delete_participant"
  on public.time_capsules for delete
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

do $migration$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      execute 'alter publication supabase_realtime add table public.time_capsules';
    exception
      when duplicate_object then
        null;
    end;
  end if;
end;
$migration$;
