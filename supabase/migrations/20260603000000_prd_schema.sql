-- Tabesaki PRD schema — run this in the Supabase SQL editor
-- WARNING: drops all existing tables and recreates from scratch

drop table if exists push_tokens cascade;
drop table if exists travel_dates cascade;
drop table if exists wishlist cascade;
drop table if exists reservation_platforms cascade;
drop table if exists restaurants cascade;

drop type if exists cuisine_type cascade;
drop type if exists platform_type cascade;
drop type if exists advance_type cascade;
drop type if exists travel_date_status cascade;
drop type if exists reservation_status cascade;
drop type if exists reservation_website cascade;

-- Enums
create type cuisine_type as enum (
  'Omakase Sushi', 'Kaiseki', 'Tempura',
  'Soba/Kappo', 'Teppanyaki', 'Yakiniku', 'Other'
);

create type platform_type as enum (
  'Omakase.in', 'TableCheck', 'Pocket Concierge',
  'TableAll', 'Tabelog', 'Ikyu', 'Other'
);

create type advance_type as enum ('rolling', 'fixed_calendar');

create type travel_date_status as enum (
  'Watching', 'Booking Soon', 'Booked', 'Visited', 'Missed'
);

-- restaurants (public — shared across users)
create table restaurants (
  id                  uuid primary key default gen_random_uuid(),
  google_place_id     text unique,
  name                text not null,
  address             text,
  cuisine             cuisine_type,
  website             text,
  phone               text,
  price_range_min     integer,
  price_range_max     integer,
  price_notes         text,
  closed_days_of_week smallint[],
  ai_extracted_at     timestamptz,
  created_at          timestamptz default now()
);

-- reservation_platforms (public — shared across users)
create table reservation_platforms (
  id                 uuid primary key default gen_random_uuid(),
  restaurant_id      uuid not null references restaurants(id) on delete cascade,
  website            platform_type not null,
  url                text,
  priority           integer not null default 1,
  advance_type       advance_type,
  advance_days       integer,
  open_day_of_month  smallint,
  open_months_prior  smallint,
  booking_open_hour  smallint check (booking_open_hour between 0 and 23),
  booking_open_minute smallint default 0 check (booking_open_minute between 0 and 59),
  booking_open_tz    text default 'Asia/Tokyo',
  course_price       integer,
  course_description text,
  notes              text,
  ai_extracted       boolean default false,
  created_at         timestamptz default now(),
  unique (restaurant_id, website)
);

-- wishlist (private — user-specific)
create table wishlist (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  notes         text,
  created_at    timestamptz default now(),
  unique (user_id, restaurant_id)
);

-- travel_dates (private — user-specific)
create table travel_dates (
  id                        uuid primary key default gen_random_uuid(),
  wishlist_id               uuid not null references wishlist(id) on delete cascade,
  desired_date              date not null,
  priority                  integer not null default 1,
  party_size                integer not null default 2,
  status                    travel_date_status not null default 'Watching',
  booking_reminder_datetime timestamptz,
  booked_at                 timestamptz,
  confirmation_notes        text,
  created_at                timestamptz default now(),
  unique (wishlist_id, desired_date),
  unique (wishlist_id, priority)
);

-- push_tokens (private — user-specific)
create table push_tokens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references auth.users(id) on delete cascade,
  token      text not null,
  updated_at timestamptz default now()
);

-- RLS
alter table restaurants enable row level security;
alter table reservation_platforms enable row level security;
alter table wishlist enable row level security;
alter table travel_dates enable row level security;
alter table push_tokens enable row level security;

-- restaurants: all authenticated users can read and write
create policy "auth read restaurants"   on restaurants for select to authenticated using (true);
create policy "auth insert restaurants" on restaurants for insert to authenticated with check (true);
create policy "auth update restaurants" on restaurants for update to authenticated using (true);

-- reservation_platforms: all authenticated users can read and write
create policy "auth read platforms"   on reservation_platforms for select to authenticated using (true);
create policy "auth insert platforms" on reservation_platforms for insert to authenticated with check (true);
create policy "auth update platforms" on reservation_platforms for update to authenticated using (true);

-- wishlist: owner only
create policy "owner wishlist" on wishlist for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- travel_dates: owner only via wishlist join
create policy "owner travel_dates" on travel_dates for all to authenticated
  using (exists (select 1 from wishlist w where w.id = wishlist_id and w.user_id = auth.uid()))
  with check (exists (select 1 from wishlist w where w.id = wishlist_id and w.user_id = auth.uid()));

-- push_tokens: owner only
create policy "owner push_tokens" on push_tokens for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
