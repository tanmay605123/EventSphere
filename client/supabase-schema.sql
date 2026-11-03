-- ====================================================================
-- 🎟️ EventSphere — Supabase Database Schema, Functions & Seed Data
-- ====================================================================
-- Run this script in the Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/ppdaqgwhsurendvsiwnp/sql/new
-- ====================================================================

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. Create Profiles Table (linked with Supabase Auth users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text,
  email text,
  phone text,
  avatar_url text,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) on profiles
alter table public.profiles enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

-- Create policies for profiles
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  to anon, authenticated
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Trigger to automatically create a profile record when a user signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do update
  set name = coalesce(excluded.name, profiles.name),
      email = excluded.email,
      phone = coalesce(excluded.phone, profiles.phone),
      updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Create Events Table
create table if not exists public.events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  category text not null,
  description text not null,
  image text not null,
  date text not null,
  time text not null,
  venue text not null,
  organizer text not null,
  total_seats integer not null default 100,
  seats_left integer not null default 100,
  price numeric not null default 0,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Enable RLS on events
alter table public.events enable row level security;

drop policy if exists "Events are viewable by everyone" on public.events;
drop policy if exists "Allow seat updates during registration" on public.events;
drop policy if exists "Allow inserting events" on public.events;

create policy "Events are viewable by everyone"
  on public.events for select
  to anon, authenticated
  using (true);

create policy "Allow seat updates during registration"
  on public.events for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "Allow inserting events"
  on public.events for insert
  to anon, authenticated
  with check (true);

-- 4. Create Registrations Table
create table if not exists public.registrations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  event_id uuid references public.events(id) on delete cascade not null,
  registration_id text not null unique,
  status text not null default 'registered',
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Foreign key link to profiles for joined attendee queries
alter table public.registrations
  drop constraint if exists fk_registrations_profile;

alter table public.registrations
  add constraint fk_registrations_profile
  foreign key (user_id) references public.profiles(id) on delete cascade;

-- Enable RLS on registrations
alter table public.registrations enable row level security;

drop policy if exists "Anyone can view registrations to see attendees" on public.registrations;
drop policy if exists "Users can register themselves" on public.registrations;
drop policy if exists "Users can update their own registration" on public.registrations;
drop policy if exists "Users can delete their own registration" on public.registrations;

-- Allows viewing attendees on event details page
create policy "Anyone can view registrations to see attendees"
  on public.registrations for select
  to anon, authenticated
  using (true);

create policy "Users can register themselves"
  on public.registrations for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own registration"
  on public.registrations for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own registration"
  on public.registrations for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- 5. Stored Function for Atomic Event Registration
create or replace function public.register_for_event(
  p_event_id uuid,
  p_user_id uuid,
  p_registration_code text
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_seats_left integer;
  v_reg record;
  v_existing record;
begin
  -- Check if already actively registered
  select * into v_existing from public.registrations
  where event_id = p_event_id and user_id = p_user_id and status = 'registered';

  if found then
    return jsonb_build_object('success', false, 'message', 'You are already registered for this event');
  end if;

  -- Lock and check available seats
  select seats_left into v_seats_left from public.events where id = p_event_id for update;
  if not found then
    return jsonb_build_object('success', false, 'message', 'Event not found');
  end if;

  if v_seats_left <= 0 then
    return jsonb_build_object('success', false, 'message', 'This event is currently full');
  end if;

  -- Insert registration
  insert into public.registrations (event_id, user_id, registration_id, status)
  values (p_event_id, p_user_id, p_registration_code, 'registered')
  returning * into v_reg;

  -- Decrement seats
  update public.events
  set seats_left = seats_left - 1
  where id = p_event_id;

  return jsonb_build_object(
    'success', true,
    'registration', row_to_json(v_reg)
  );
end;
$$;

grant execute on function public.register_for_event(uuid, uuid, text) to anon, authenticated;

-- 6. Stored Function for Cancelling Registration
create or replace function public.cancel_event_registration(
  p_registration_id text,
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_reg record;
begin
  select * into v_reg from public.registrations
  where registration_id = p_registration_id and user_id = p_user_id and status = 'registered'
  for update;

  if not found then
    return jsonb_build_object('success', false, 'message', 'Active registration not found');
  end if;

  update public.registrations
  set status = 'cancelled'
  where id = v_reg.id;

  update public.events
  set seats_left = seats_left + 1
  where id = v_reg.event_id;

  return jsonb_build_object('success', true);
end;
$$;

grant execute on function public.cancel_event_registration(text, uuid) to anon, authenticated;

-- 7. Grant Schema Access to anon and authenticated roles
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant all on all routines in schema public to anon, authenticated;

-- 8. Seed Default Events
insert into public.events (id, title, category, description, image, date, time, venue, organizer, total_seats, seats_left, price)
select
  'c68bb897-37f9-a8c9-5253-a72a00000001'::uuid,
  'Global AI & Web3 Hackathon 2026',
  'Tech',
  'Join 500+ developers, designers, and innovators building next-generation AI and decentralized apps. 36 hours of non-stop hacking, mentoring from industry leaders, free food, and $50,000 in prizes! Teams will receive cloud credits and direct access to top tech recruiters.',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
  '2026-11-15',
  '09:00 AM',
  'Metropolis Tech Park, Hall 4, San Francisco, CA',
  'DevSphere Innovation Labs',
  250,
  42,
  0
where not exists (select 1 from public.events where title = 'Global AI & Web3 Hackathon 2026');

insert into public.events (id, title, category, description, image, date, time, venue, organizer, total_seats, seats_left, price)
select
  '9398ffa4-23f9-ec5c-28c6-201100000002'::uuid,
  'Neon Beats Indie Music Fest',
  'Cultural',
  'An unforgettable evening of live acoustic, synthwave, and indie rock under the stars. Featuring top regional breakthrough bands, food trucks, light art installations, and curated artisan stalls.',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
  '2026-11-20',
  '06:30 PM',
  'Riverfront Amphitheater, Austin, TX',
  'Pulse Live Entertainment',
  500,
  87,
  25
where not exists (select 1 from public.events where title = 'Neon Beats Indie Music Fest');

insert into public.events (id, title, category, description, image, date, time, venue, organizer, total_seats, seats_left, price)
select
  'e19ec7a6-512a-48ac-4fa2-e10300000003'::uuid,
  'Inter-City Smash Badminton Championship',
  'Sports',
  'Annual amateur and semi-pro badminton showdown. Men''s & Women''s singles and doubles tournament with official BWF scoring, live streaming, trophies, and athletic gear hampers.',
  'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80',
  '2026-12-05',
  '08:30 AM',
  'Olympus Indoor Arena, Chicago, IL',
  'Midwest Racquet Club',
  100,
  22,
  30
where not exists (select 1 from public.events where title = 'Inter-City Smash Badminton Championship');

insert into public.events (id, title, category, description, image, date, time, venue, organizer, total_seats, seats_left, price)
select
  '0a4122a0-adfe-5dfa-66a3-c42c00000004'::uuid,
  'Full-Stack Design Systems Masterclass',
  'Workshops',
  'From Figma tokens to reusable Tailwind & React component libraries. Deep dive into accessible components, compound components, token synchronization, and micro-interactions.',
  'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1200&q=80',
  '2026-12-10',
  '02:00 PM',
  'Digital Arts Academy, Denver, CO',
  'UI/UX Collective',
  50,
  11,
  40
where not exists (select 1 from public.events where title = 'Full-Stack Design Systems Masterclass');

insert into public.events (id, title, category, description, image, date, time, venue, organizer, total_seats, seats_left, price)
select
  '1b4122a0-adfe-5dfa-66a3-c42c00000005'::uuid,
  'Future of Cloud Architecture Summit',
  'Tech',
  'Deep dive into modern serverless architectures, edge computing, distributed databases, and Kubernetes best practices with senior staff engineers from top cloud platforms.',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
  '2026-11-28',
  '10:00 AM',
  'Grand Horizon Convention Center, Seattle, WA',
  'Cloud Scale Foundation',
  300,
  65,
  15
where not exists (select 1 from public.events where title = 'Future of Cloud Architecture Summit');

insert into public.events (id, title, category, description, image, date, time, venue, organizer, total_seats, seats_left, price)
select
  '2c4122a0-adfe-5dfa-66a3-c42c00000006'::uuid,
  'Urban Marathon & Fitness Carnival 2026',
  'Sports',
  '5K, 10K, and Half Marathon routes through scenic city landmarks. Includes hydration stations, finisher medals, timing chips, and a post-race music recovery lounge.',
  'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=1200&q=80',
  '2026-12-18',
  '06:00 AM',
  'Central Waterfront Boulevard, Boston, MA',
  'Metro Athletics League',
  600,
  140,
  10
where not exists (select 1 from public.events where title = 'Urban Marathon & Fitness Carnival 2026');
