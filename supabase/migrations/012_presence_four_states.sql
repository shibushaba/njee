-- Narrow ambient presence to four common statuses (1:1 app).

update public.profiles
set presence_status = case
  when presence_status in ('quiet_mode', 'listening', 'idle', 'awake_late') then 'active_now'
  else presence_status
end;

alter table public.profiles drop constraint if exists profiles_presence_status_ck;

alter table public.profiles
  add constraint profiles_presence_status_ck check (
    presence_status in (
      'active_now',
      'sleeping',
      'studying',
      'away'
    )
  );

comment on column public.profiles.presence_status is 'Ambient presence: here, resting, in focus, or away.';
