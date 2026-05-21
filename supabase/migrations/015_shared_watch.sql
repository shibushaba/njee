-- Shared watch shelf for two users (links, titles, notes, status).

create table if not exists public.watch_items (
  id uuid primary key default gen_random_uuid(),
  pair_key text not null,
  added_by uuid not null references auth.users (id) on delete cascade,
  url text not null default '',
  title text not null,
  notes text null,
  status text not null default 'watch_later',
  source_type text not null default 'link',
  context_label text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint watch_items_status_ck check (status in ('watch_later', 'watching', 'favorite')),
  constraint watch_items_source_ck check (source_type in ('youtube', 'link', 'title')),
  constraint watch_items_title_len check (char_length(trim(title)) between 1 and 300),
  constraint watch_items_url_len check (char_length(url) <= 2000),
  constraint watch_items_notes_len check (notes is null or char_length(notes) <= 2000),
  constraint watch_items_payload_ck check (char_length(trim(url)) > 0 or source_type = 'title')
);

create index if not exists watch_items_pair_updated
  on public.watch_items (pair_key, updated_at desc);

comment on table public.watch_items is 'Shared cozy watchlist between two profiles.';

alter table public.watch_items enable row level security;

-- pair_key is "uuid:uuid" (sorted) from the app — user must be one side of the pair.
create policy "watch_items_select_participant"
  on public.watch_items for select
  to authenticated
  using (
    auth.uid()::text = split_part(pair_key, ':', 1)
    or auth.uid()::text = split_part(pair_key, ':', 2)
  );

create policy "watch_items_insert_participant"
  on public.watch_items for insert
  to authenticated
  with check (
    added_by = auth.uid()
    and (
      auth.uid()::text = split_part(pair_key, ':', 1)
      or auth.uid()::text = split_part(pair_key, ':', 2)
    )
  );

create policy "watch_items_update_participant"
  on public.watch_items for update
  to authenticated
  using (
    auth.uid()::text = split_part(pair_key, ':', 1)
    or auth.uid()::text = split_part(pair_key, ':', 2)
  )
  with check (
    auth.uid()::text = split_part(pair_key, ':', 1)
    or auth.uid()::text = split_part(pair_key, ':', 2)
  );

create policy "watch_items_delete_participant"
  on public.watch_items for delete
  to authenticated
  using (
    auth.uid()::text = split_part(pair_key, ':', 1)
    or auth.uid()::text = split_part(pair_key, ':', 2)
  );

do $migration$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      execute 'alter publication supabase_realtime add table public.watch_items';
    exception
      when duplicate_object then
        null;
    end;
  end if;
end;
$migration$;
