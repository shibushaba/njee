-- Movie suggestion portal: explicit recipient, stars, priority, watched + abi.

alter table public.watch_items drop constraint if exists watch_items_status_ck;

alter table public.watch_items
  add column if not exists recipient_id uuid references auth.users (id) on delete cascade;

alter table public.watch_items
  add column if not exists suggest_stars smallint not null default 3;

alter table public.watch_items
  add column if not exists priority smallint not null default 2;

alter table public.watch_items
  add column if not exists abi text null;

alter table public.watch_items
  add column if not exists stars_watch smallint null;

alter table public.watch_items
  add column if not exists watched_at timestamptz null;

-- Backfill recipient as the other member of the pair (suggester = added_by).
update public.watch_items w
set recipient_id = (
  case
    when split_part(w.pair_key, ':', 1) = w.added_by::text then split_part(w.pair_key, ':', 2)::uuid
    else split_part(w.pair_key, ':', 1)::uuid
  end
)
where w.recipient_id is null;

alter table public.watch_items alter column recipient_id set not null;

-- Migrate legacy statuses into the new flow.
update public.watch_items
set status = case
  when status = 'watching' then 'watching'
  else 'suggested'
end;

alter table public.watch_items
  add constraint watch_items_status_portal_ck check (status in ('suggested', 'watching', 'watched'));

alter table public.watch_items
  add constraint watch_items_suggest_stars_ck check (suggest_stars between 1 and 5);

alter table public.watch_items
  add constraint watch_items_priority_ck check (priority between 1 and 3);

alter table public.watch_items
  add constraint watch_items_stars_watch_ck check (stars_watch is null or stars_watch between 1 and 5);

alter table public.watch_items
  add constraint watch_items_abi_len check (abi is null or char_length(abi) <= 2000);

alter table public.watch_items
  add constraint watch_items_watched_consistency_ck check (
    status <> 'watched'
    or (watched_at is not null and stars_watch is not null and abi is not null and char_length(trim(abi)) > 0)
  );

comment on column public.watch_items.recipient_id is 'Who the suggestion is for (the other user in the pair).';
comment on column public.watch_items.suggest_stars is 'Suggester rating 1–5 when proposing.';
comment on column public.watch_items.priority is '1 = highest, 3 = lowest.';
comment on column public.watch_items.abi is 'After watching: short review (abi), required when status = watched.';
comment on column public.watch_items.stars_watch is 'After watching: 1–5 stars; required when status = watched.';

drop policy if exists "watch_items_insert_participant" on public.watch_items;

create policy "watch_items_insert_suggester"
  on public.watch_items for insert
  to authenticated
  with check (
    added_by = auth.uid()
    and recipient_id <> added_by
    and auth.uid()::text in (split_part(pair_key, ':', 1), split_part(pair_key, ':', 2))
    and (
      (
        split_part(pair_key, ':', 1) = added_by::text
        and split_part(pair_key, ':', 2) = recipient_id::text
      )
      or (
        split_part(pair_key, ':', 2) = added_by::text
        and split_part(pair_key, ':', 1) = recipient_id::text
      )
    )
  );
