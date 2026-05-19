-- Broadcast message row updates (e.g. current_views, is_locked) to Realtime subscribers.
-- Required for disappearing media to sync instantly across devices.

do $migration$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      execute 'alter publication supabase_realtime add table public.messages';
    exception
      when duplicate_object then
        null;
    end;
  end if;
end;
$migration$;
