-- Media messages + private Storage bucket `media` (two-user chat).

-- Messages: media metadata + relaxed type/content rules
alter table public.messages drop constraint if exists messages_content_len;
alter table public.messages drop constraint if exists messages_type_text;

alter table public.messages
  add column if not exists media_url text,
  add column if not exists media_type text,
  add column if not exists view_limit integer,
  add column if not exists current_views integer not null default 0;

alter table public.messages alter column content set default '';

alter table public.messages drop constraint if exists messages_type_allowed;
alter table public.messages drop constraint if exists messages_media_type_allowed;
alter table public.messages drop constraint if exists messages_body_ck;

alter table public.messages add constraint messages_type_allowed
  check (message_type in ('text', 'image', 'video'));

alter table public.messages add constraint messages_media_type_allowed
  check (media_type is null or media_type in ('image', 'video'));

alter table public.messages add constraint messages_body_ck check (
  (message_type = 'text'
    and media_url is null
    and char_length(trim(content)) between 1 and 4000)
  or
  (message_type = 'image'
    and media_url is not null
    and media_type = 'image'
    and char_length(content) <= 4000)
  or
  (message_type = 'video'
    and media_url is not null
    and media_type = 'video'
    and char_length(content) <= 4000)
);

comment on column public.messages.media_url is 'Path inside Storage bucket media (thread folder / filename).';
comment on column public.messages.view_limit is 'Optional cap on counted opens; null = unlimited.';

-- RPC: bump view counter (no broad UPDATE policy on messages)
create or replace function public.increment_message_media_views(p_message_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.messages
  set current_views = current_views + 1
  where id = p_message_id
    and message_type in ('image', 'video')
    and (sender_id = auth.uid() or receiver_id = auth.uid())
    and (view_limit is null or current_views < view_limit);
end;
$$;

revoke all on function public.increment_message_media_views(uuid) from public;
grant execute on function public.increment_message_media_views(uuid) to authenticated;

-- Private bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  false,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "media_select_thread_participant" on storage.objects;
drop policy if exists "media_insert_thread_participant" on storage.objects;
drop policy if exists "media_delete_own_prefix" on storage.objects;

-- Path: {uuid}--{uuid}/{filename}  (sorted pair from chatRoomTopicId with ':' -> '--')
create policy "media_select_thread_participant"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'media'
    and (
      (split_part(split_part(name, '/', 1), '--', 1))::uuid = auth.uid()
      or (split_part(split_part(name, '/', 1), '--', 2))::uuid = auth.uid()
    )
  );

create policy "media_insert_thread_participant"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'media'
    and (
      (split_part(split_part(name, '/', 1), '--', 1))::uuid = auth.uid()
      or (split_part(split_part(name, '/', 1), '--', 2))::uuid = auth.uid()
    )
  );

create policy "media_delete_own_prefix"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'media'
    and split_part(name, '/', 2) is not null
    and split_part(name, '/', 2) <> ''
    and (
      (split_part(split_part(name, '/', 1), '--', 1))::uuid = auth.uid()
      or (split_part(split_part(name, '/', 1), '--', 2))::uuid = auth.uid()
    )
  );
