-- nje realtime chat: profiles + messages
-- Run in Supabase SQL editor or via CLI.
-- After apply: Dashboard → Database → Replication → enable messages for supabase_realtime (if not auto-enabled).

-- Profiles (map auth user → display username for chat header)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Messages (1:1 between two participants)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users (id) on delete cascade,
  receiver_id uuid not null references auth.users (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  seen boolean not null default false,
  message_type text not null default 'text',
  constraint messages_content_len check (char_length(content) between 1 and 4000),
  constraint messages_no_self check (sender_id <> receiver_id),
  constraint messages_type_text check (message_type = 'text')
);

create index if not exists messages_pair_created
  on public.messages (sender_id, receiver_id, created_at);

create index if not exists messages_pair_created_rev
  on public.messages (receiver_id, sender_id, created_at);

alter table public.messages enable row level security;

create policy "messages_select_participant"
  on public.messages for select
  to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "messages_insert_as_sender"
  on public.messages for insert
  to authenticated
  with check (auth.uid() = sender_id);

create policy "messages_update_receiver_seen"
  on public.messages for update
  to authenticated
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);

-- Realtime: in Supabase Dashboard → Database → Publications → supabase_realtime
-- add the `messages` table (SQL: alter publication supabase_realtime add table public.messages;)
-- may error if already added — safe to skip in that case.
