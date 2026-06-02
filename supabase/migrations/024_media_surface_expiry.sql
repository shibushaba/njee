-- Chat vs Memories media surfaces + 24h expiry for Keep and voice.

alter table public.messages
  add column if not exists media_surface text null,
  add column if not exists media_expires_at timestamptz null;

alter table public.messages drop constraint if exists messages_media_surface_ck;
alter table public.messages add constraint messages_media_surface_ck
  check (media_surface is null or media_surface in ('chat', 'memories'));

comment on column public.messages.media_surface is 'chat = thread media (Supabase Storage). memories = shelf media (Google Drive when configured).';
comment on column public.messages.media_expires_at is 'When set, clients purge Storage/Drive blob after this time (Keep + voice = ~24h from send).';

create index if not exists messages_media_expires_idx
  on public.messages (media_expires_at)
  where media_expires_at is not null and media_url is not null;
