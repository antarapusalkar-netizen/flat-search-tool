-- Run once in your Supabase project's SQL editor, then set SUPABASE_URL and
-- SUPABASE_SERVICE_ROLE_KEY in .env.local (and in Vercel's env vars).

create table if not exists constraints (
  person text primary key check (person in ('riya', 'meera', 'kavita')),
  max_rent numeric not null,
  no_go_areas text[] not null default '{}',
  hard_requirements jsonb not null default '{}'::jsonb,
  soft_preferences text[] not null default '{}',
  submitted_at timestamptz not null default now()
);

create table if not exists flats (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null default '',
  area text not null,
  rent numeric not null,
  floor int not null default 0,
  has_lift boolean not null default false,
  has_parking boolean not null default false,
  bathrooms int not null default 1,
  pet_friendly boolean not null default false,
  notes text not null default '',
  created_at timestamptz not null default now()
);

-- This app talks to Supabase only from server-side API routes using the
-- service role key, so RLS can stay locked down (default: no anon access).
alter table constraints enable row level security;
alter table flats enable row level security;
