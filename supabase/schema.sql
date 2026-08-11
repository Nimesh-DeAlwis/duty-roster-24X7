-- Run this once in Supabase Dashboard -> SQL Editor

-- Staff list (used for the name dropdown + rotation auto-fill)
create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int default 0,
  active boolean default true,
  created_at timestamptz default now()
);

-- Each saved weekly roster (either "shift" type like image 1,
-- or "dedicated" type with dedicated + 2 standby rows like image 2)
create table if not exists rosters (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  roster_type text not null check (roster_type in ('shift', 'dedicated')),
  start_date date not null,
  default_time text default '7.30pm - 11.00pm',
  row_labels text[] not null default '{}',
  entries jsonb not null default '{}',
  -- entries shape: { "2026-07-27": { "Shift": "Nimesh (7.30pm - 11.00pm)" } }
  -- or:            { "2026-08-03": { "Dedicated Person": "Vajira", "Stand by Person 1": "" } }
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Keep updated_at fresh
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_rosters_updated_at on rosters;
create trigger trg_rosters_updated_at
before update on rosters
for each row execute procedure set_updated_at();

-- Enable Row Level Security
alter table staff enable row level security;
alter table rosters enable row level security;

-- Simple open policies so the anon key can read/write.
-- This is fine for a small internal team tool that isn't public.
-- If you want this locked down, replace these with auth.uid() checks
-- once you add Supabase Auth (email/password) login.
drop policy if exists "public read staff" on staff;
create policy "public read staff" on staff for select using (true);
drop policy if exists "public write staff" on staff;
create policy "public write staff" on staff for insert with check (true);
drop policy if exists "public update staff" on staff;
create policy "public update staff" on staff for update using (true);
drop policy if exists "public delete staff" on staff;
create policy "public delete staff" on staff for delete using (true);

drop policy if exists "public read rosters" on rosters;
create policy "public read rosters" on rosters for select using (true);
drop policy if exists "public write rosters" on rosters;
create policy "public write rosters" on rosters for insert with check (true);
drop policy if exists "public update rosters" on rosters;
create policy "public update rosters" on rosters for update using (true);
drop policy if exists "public delete rosters" on rosters;
create policy "public delete rosters" on rosters for delete using (true);

-- Seed your usual staff names (edit/remove as you like)
insert into staff (name, sort_order) values
  ('Nimesh', 1),
  ('Vajira', 2),
  ('Induru', 3),
  ('Deshan', 4),
  ('Supun', 5),
  ('Buddheepana', 6),
  ('Budipana', 7),
  ('Sameera', 8),
  ('Charith', 9)
on conflict (name) do nothing;
