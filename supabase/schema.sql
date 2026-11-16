-- =====================================================================
-- Gym Management System — Supabase schema
-- Run this whole file once in Supabase Dashboard → SQL Editor.
-- Then run seed.sql (optional) for sample plans/programs.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Profiles: one row per login. role = 'admin' (trainer) or 'member'.
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  role        text not null default 'member' check (role in ('admin', 'member')),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Public website content
-- ---------------------------------------------------------------------
create table if not exists public.site_settings (
  id               int primary key default 1 check (id = 1),
  gym_name         text not null default 'My Gym',
  trainer_name     text not null default 'Coach',
  tagline          text,
  bio              text,
  phone            text,
  whatsapp         text,             -- digits with country code, e.g. 919876543210
  email            text,
  address          text,
  map_url          text,
  instagram        text,
  youtube          text,
  hours            text,
  years_experience int default 0,
  clients_trained  int default 0,
  certifications   text[] default '{}',
  upi_id           text,             -- shown to members for offline UPI payment
  updated_at       timestamptz not null default now()
);
-- Added for the Medilife design (safe to re-run on an existing database)
alter table public.site_settings add column if not exists tagline_hi     text;          -- Hindi tagline shown under the hero
alter table public.site_settings add column if not exists hero_image_url text;          -- photo inside the hero arch
alter table public.site_settings add column if not exists gallery_urls   text[] default '{}';
insert into public.site_settings (id) values (1) on conflict do nothing;

create table if not exists public.plans (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  duration_days  int  not null check (duration_days > 0),
  price          numeric(10,2) not null check (price >= 0),
  description    text,
  features       text[] default '{}',
  is_active      boolean not null default true,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now()
);

create table if not exists public.testimonials (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  text          text not null,
  result        text,                -- e.g. "Lost 12 kg in 4 months"
  is_published  boolean not null default true,
  created_at    timestamptz not null default now()
);

create table if not exists public.leads (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  phone           text not null,
  email           text,
  message         text,
  interested_plan text,
  status          text not null default 'new' check (status in ('new','contacted','joined','lost')),
  created_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Programs (templates assigned to members)
-- schedule: [{ "day": "Mon", "focus": "Chest", "exercises": [{ "name": "...", "sets": "4", "reps": "10", "notes": "" }] }]
-- meals:    [{ "time": "7:00 AM", "name": "Breakfast", "items": "..." }]
-- ---------------------------------------------------------------------
create table if not exists public.workout_plans (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  schedule     jsonb not null default '[]',
  created_at   timestamptz not null default now()
);

create table if not exists public.diet_plans (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  calories     int,
  meals        jsonb not null default '[]',
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Members & their records
-- ---------------------------------------------------------------------
create table if not exists public.members (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid unique references auth.users(id) on delete set null,
  full_name        text not null,
  email            text unique,
  phone            text,
  gender           text,
  dob              date,
  joined_on        date not null default current_date,
  goal             text,
  notes            text,
  height_cm        numeric(5,1),
  workout_plan_id  uuid references public.workout_plans(id) on delete set null,
  diet_plan_id     uuid references public.diet_plans(id) on delete set null,
  created_at       timestamptz not null default now()
);
create index if not exists members_email_idx on public.members (lower(email));

create table if not exists public.subscriptions (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.members(id) on delete cascade,
  plan_id     uuid references public.plans(id) on delete set null,
  plan_name   text not null,          -- copied so history survives plan edits
  start_date  date not null,
  end_date    date not null,
  price       numeric(10,2) not null default 0,
  created_at  timestamptz not null default now(),
  check (end_date >= start_date)
);
create index if not exists subscriptions_member_idx on public.subscriptions (member_id, end_date desc);

create table if not exists public.payments (
  id               uuid primary key default gen_random_uuid(),
  member_id        uuid not null references public.members(id) on delete cascade,
  subscription_id  uuid references public.subscriptions(id) on delete set null,
  amount           numeric(10,2) not null check (amount > 0),
  method           text not null default 'cash' check (method in ('cash','upi','card','bank','other')),
  paid_on          date not null default current_date,
  note             text,
  created_at       timestamptz not null default now()
);
create index if not exists payments_member_idx on public.payments (member_id, paid_on desc);

create table if not exists public.attendance (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.members(id) on delete cascade,
  check_in    date not null default current_date,
  created_at  timestamptz not null default now(),
  unique (member_id, check_in)
);

create table if not exists public.progress_logs (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.members(id) on delete cascade,
  logged_on   date not null default current_date,
  weight_kg   numeric(5,1),
  body_fat    numeric(4,1),
  waist_cm    numeric(5,1),
  notes       text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Helper functions (security definer so they can be used inside RLS)
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.my_member_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.members where user_id = auth.uid() limit 1;
$$;

-- When someone signs up: create a profile and link them to the member row
-- the trainer created with the same email address.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'member')
  on conflict (id) do nothing;

  update public.members
     set user_id = new.id
   where lower(email) = lower(new.email)
     and user_id is null;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- If the trainer adds a member AFTER that person already signed up, link them.
create or replace function public.link_member_to_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.user_id is null and new.email is not null then
    select id into new.user_id from auth.users where lower(email) = lower(new.email) limit 1;
  end if;
  return new;
end;
$$;

drop trigger if exists members_link_user on public.members;
create trigger members_link_user
  before insert or update of email on public.members
  for each row execute function public.link_member_to_user();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.site_settings  enable row level security;
alter table public.plans          enable row level security;
alter table public.testimonials   enable row level security;
alter table public.leads          enable row level security;
alter table public.workout_plans  enable row level security;
alter table public.diet_plans     enable row level security;
alter table public.members        enable row level security;
alter table public.subscriptions  enable row level security;
alter table public.payments       enable row level security;
alter table public.attendance     enable row level security;
alter table public.progress_logs  enable row level security;

-- profiles: you can read your own; admin reads all. Nobody changes roles from the app.
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

-- Public website content: anyone can read; only admin writes.
drop policy if exists "site public read" on public.site_settings;
create policy "site public read" on public.site_settings for select using (true);
drop policy if exists "site admin write" on public.site_settings;
create policy "site admin write" on public.site_settings for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "plans public read" on public.plans;
create policy "plans public read" on public.plans for select using (is_active or public.is_admin());
drop policy if exists "plans admin write" on public.plans;
create policy "plans admin write" on public.plans for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "testimonials public read" on public.testimonials;
create policy "testimonials public read" on public.testimonials for select using (is_published or public.is_admin());
drop policy if exists "testimonials admin write" on public.testimonials;
create policy "testimonials admin write" on public.testimonials for all using (public.is_admin()) with check (public.is_admin());

-- Leads: website visitors can submit (insert only); admin manages.
drop policy if exists "leads public insert" on public.leads;
create policy "leads public insert" on public.leads for insert with check (status = 'new');
drop policy if exists "leads admin all" on public.leads;
create policy "leads admin all" on public.leads for all using (public.is_admin()) with check (public.is_admin());

-- Programs: admin manages; a member can read the ones assigned to them.
drop policy if exists "workouts admin all" on public.workout_plans;
create policy "workouts admin all" on public.workout_plans for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "workouts member read" on public.workout_plans;
create policy "workouts member read" on public.workout_plans for select
  using (id = (select workout_plan_id from public.members where id = public.my_member_id()));

drop policy if exists "diets admin all" on public.diet_plans;
create policy "diets admin all" on public.diet_plans for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "diets member read" on public.diet_plans;
create policy "diets member read" on public.diet_plans for select
  using (id = (select diet_plan_id from public.members where id = public.my_member_id()));

-- Members: admin manages; a member reads only their own row.
drop policy if exists "members admin all" on public.members;
create policy "members admin all" on public.members for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "members self read" on public.members;
create policy "members self read" on public.members for select using (user_id = auth.uid());

-- Subscriptions / payments / attendance: admin manages; member reads own.
drop policy if exists "subs admin all" on public.subscriptions;
create policy "subs admin all" on public.subscriptions for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "subs self read" on public.subscriptions;
create policy "subs self read" on public.subscriptions for select using (member_id = public.my_member_id());

drop policy if exists "payments admin all" on public.payments;
create policy "payments admin all" on public.payments for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "payments self read" on public.payments;
create policy "payments self read" on public.payments for select using (member_id = public.my_member_id());

drop policy if exists "attendance admin all" on public.attendance;
create policy "attendance admin all" on public.attendance for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "attendance self read" on public.attendance;
create policy "attendance self read" on public.attendance for select using (member_id = public.my_member_id());

-- Progress: member can read and add their own entries; admin manages all.
drop policy if exists "progress admin all" on public.progress_logs;
create policy "progress admin all" on public.progress_logs for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "progress self read" on public.progress_logs;
create policy "progress self read" on public.progress_logs for select using (member_id = public.my_member_id());
drop policy if exists "progress self insert" on public.progress_logs;
create policy "progress self insert" on public.progress_logs for insert with check (member_id = public.my_member_id());
drop policy if exists "progress self delete" on public.progress_logs;
create policy "progress self delete" on public.progress_logs for delete using (member_id = public.my_member_id());

-- ---------------------------------------------------------------------
-- LAST STEP (manual): make the trainer an admin.
-- 1. Sign up on the website's /login page with the trainer's email.
-- 2. Run:  update public.profiles set role = 'admin' where email = 'trainer@example.com';
-- ---------------------------------------------------------------------
