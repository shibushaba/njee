-- Shared pinned moments (1:1 thread). message_id type follows public.messages.id (uuid or bigint).

do $pinned$
declare
  id_datatype text;
  pin_mid text;
begin
  select c.data_type
  into id_datatype
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'messages'
    and c.column_name = 'id';

  if id_datatype is null then
    raise exception 'public.messages.id column not found';
  end if;

  if id_datatype not in ('uuid', 'bigint') then
    raise exception 'Unsupported public.messages.id type: % (expected uuid or bigint)', id_datatype;
  end if;

  select c.data_type
  into pin_mid
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'pinned_moments'
    and c.column_name = 'message_id';

  if pin_mid is not null and pin_mid = id_datatype then
    return;
  end if;

  drop table if exists public.pinned_moments cascade;

  execute format(
    $sql$
    create table public.pinned_moments (
      id uuid primary key default gen_random_uuid(),
      message_id %s not null references public.messages (id) on delete cascade,
      pair_key text not null,
      pinned_by uuid not null references auth.users (id) on delete cascade,
      pinned_at timestamptz not null default now(),
      context_label text null,
      constraint pinned_moments_message_unique unique (message_id),
      constraint pinned_moments_context_len check (context_label is null or char_length(context_label) <= 64)
    )
    $sql$,
    id_datatype
  );

  execute 'create index if not exists pinned_moments_pair_pinned on public.pinned_moments (pair_key, pinned_at desc)';

  execute $cmt$
    comment on table public.pinned_moments is 'Emotional bookmarks for the two-user thread; one row per message.';
    comment on column public.pinned_moments.pair_key is 'Stable thread id (sorted user ids joined with colon).';
    comment on column public.pinned_moments.context_label is 'Optional soft context when pinned (e.g. late_night, study_mode).';
  $cmt$;

  execute 'alter table public.pinned_moments enable row level security';

  execute $pol$
    create policy "pinned_moments_select_participant"
      on public.pinned_moments for select
      to authenticated
      using (
        exists (
          select 1
          from public.messages m
          where m.id = pinned_moments.message_id
            and (m.sender_id = auth.uid() or m.receiver_id = auth.uid())
        )
      );

    create policy "pinned_moments_insert_participant"
      on public.pinned_moments for insert
      to authenticated
      with check (
        pinned_by = auth.uid()
        and exists (
          select 1
          from public.messages m
          where m.id = message_id
            and (m.sender_id = auth.uid() or m.receiver_id = auth.uid())
            and m.deleted_at is null
        )
      );

    create policy "pinned_moments_delete_participant"
      on public.pinned_moments for delete
      to authenticated
      using (
        exists (
          select 1
          from public.messages m
          where m.id = pinned_moments.message_id
            and (m.sender_id = auth.uid() or m.receiver_id = auth.uid())
        )
      );
  $pol$;
end;
$pinned$;

do $migration$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      execute 'alter publication supabase_realtime add table public.pinned_moments';
    exception
      when duplicate_object then
        null;
    end;
  end if;
end;
$migration$;
