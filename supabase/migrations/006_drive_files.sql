-- Google Drive file metadata mirror (binary lives in Drive; Supabase = index + pair RLS).

create table if not exists public.drive_files (
  id uuid primary key default gen_random_uuid(),
  google_file_id text not null unique,
  google_drive_id text,
  name text not null,
  mime_type text not null default 'application/octet-stream',
  size_bytes bigint,
  category text not null
    check (category in ('photos', 'videos', 'documents', 'voice_notes', 'random')),
  web_view_link text,
  thumbnail_link text,
  uploaded_by uuid not null references auth.users (id) on delete cascade,
  participant_one uuid not null references auth.users (id) on delete cascade,
  participant_two uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint drive_files_pair_order check (participant_one < participant_two),
  constraint drive_files_uploader_in_pair check (
    uploaded_by = participant_one or uploaded_by = participant_two
  )
);

create index if not exists drive_files_pair_cat_created
  on public.drive_files (participant_one, participant_two, category, created_at desc);

alter table public.drive_files enable row level security;

create policy "drive_files_select_participant"
  on public.drive_files for select
  to authenticated
  using (auth.uid() = participant_one or auth.uid() = participant_two);

create policy "drive_files_insert_participant"
  on public.drive_files for insert
  to authenticated
  with check (
    auth.uid() = uploaded_by
    and (auth.uid() = participant_one or auth.uid() = participant_two)
  );

create policy "drive_files_delete_participant"
  on public.drive_files for delete
  to authenticated
  using (auth.uid() = participant_one or auth.uid() = participant_two);

do $migration$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      execute 'alter publication supabase_realtime add table public.drive_files';
    exception
      when duplicate_object then
        null;
    end;
  end if;
end;
$migration$;
