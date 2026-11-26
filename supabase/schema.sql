-- Run this once in the Supabase SQL editor.
-- The website uses the service role key on the server. Row level security stays on
-- with no public policies, so the anon key cannot read guest details.

create table if not exists inventory (
  room_id text primary key,
  total integer not null check (total >= 0 and total <= 100)
);

create table if not exists bookings (
  reference text primary key,
  source text not null check (source in ('channel', 'direct')),
  guest_name text not null default '',
  email text not null default '',
  phone text not null default '',
  channel text not null default '',
  check_in date not null,
  check_out date not null,
  status text not null,
  amount integer not null default 0,
  channel_updated boolean not null default false,
  created_at timestamptz,
  paid_at timestamptz
);

create table if not exists booking_rooms (
  reference text not null references bookings (reference) on delete cascade,
  room_id text not null,
  units integer not null check (units > 0),
  primary key (reference, room_id)
);

create table if not exists settings (
  key text primary key,
  value text not null
);

insert into inventory (room_id, total)
values ('deluxe', 4), ('premier', 2), ('family', 2), ('queen', 1), ('king', 1)
on conflict (room_id) do nothing;

alter table inventory enable row level security;
alter table bookings enable row level security;
alter table booking_rooms enable row level security;
alter table settings enable row level security;

-- Availability is calculated from bookings when a guest checks dates.
drop function if exists refresh_room_nights();
drop function if exists cancel_expired_holds();
drop view if exists room_nights;
drop view if exists room_night_bookings;
drop table if exists room_night_bookings;
drop table if exists room_nights;

do $$
declare
  existing bigint;
begin
  if to_regnamespace('cron') is null then
    return;
  end if;
  select jobid into existing from cron.job where jobname = 'cancel-expired-holds';
  if existing is not null then
    perform cron.unschedule(existing);
  end if;
end $$;
