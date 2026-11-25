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

create table if not exists room_nights (
  room_id text not null,
  night date not null,
  available integer not null,
  primary key (room_id, night)
);

create table if not exists room_night_bookings (
  room_id text not null,
  night date not null,
  reference text not null references bookings (reference) on delete cascade,
  primary key (room_id, night, reference)
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
alter table room_nights enable row level security;
alter table room_night_bookings enable row level security;
alter table settings enable row level security;

create or replace function refresh_room_nights()
returns void
language plpgsql
security definer
as $$
begin
  delete from room_night_bookings where room_id is not null;
  delete from room_nights where room_id is not null;

  insert into room_night_bookings (room_id, night, reference)
  select br.room_id, d::date, b.reference
  from bookings b
  join booking_rooms br on br.reference = b.reference
  cross join generate_series(b.check_in, b.check_out - 1, interval '1 day') as d
  where (
    b.source = 'channel' and b.status in ('confirmed', 'completed')
  ) or (
    b.source = 'direct' and (
      b.status = 'paid'
      or (b.status = 'pending' and b.created_at > now() - interval '30 minutes')
    )
  );

  insert into room_nights (room_id, night, available)
  select held.room_id, held.night, greatest(0, i.total - held.used)
  from (
    select rnb.room_id, rnb.night, sum(br.units) as used
    from room_night_bookings rnb
    join booking_rooms br on br.reference = rnb.reference and br.room_id = rnb.room_id
    group by rnb.room_id, rnb.night
  ) held
  join inventory i on i.room_id = held.room_id;
end;
$$;

revoke all on function refresh_room_nights() from public;
grant execute on function refresh_room_nights() to service_role;
