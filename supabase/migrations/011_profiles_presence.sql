-- Ambient presence / sleep-style status (two-user thread); persisted on profiles + optional Realtime.

alter table public.profiles
  add column if not exists presence_status text not null default 'active_now',
  add column if not exists presence_updated_at timestamptz not null default now(),
  add column if not exists presence_auto_night boolean not null default true,
  add column if not exists presence_idle_auto boolean not null default true;

alter table public.profiles drop constraint if exists profiles_presence_status_ck;

alter table public.profiles
  add constraint profiles_presence_status_ck check (
    presence_status in (
      'active_now',
      'sleeping',
      'studying',
      'away',
      'quiet_mode',
      'awake_late',
      'listening',
      'idle'
    )
  );

comment on column public.profiles.presence_status is 'Ambient manual/auto presence for the 1:1 app.';
comment on column public.profiles.presence_auto_night is 'When true, client may suggest awake_late in local late-night window.';
comment on column public.profiles.presence_idle_auto is 'When true, client may set idle after inactivity.';

do $migration$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      execute 'alter publication supabase_realtime add table public.profiles';
    exception
      when duplicate_object then
        null;
    end;
  end if;
end;
$migration$;
