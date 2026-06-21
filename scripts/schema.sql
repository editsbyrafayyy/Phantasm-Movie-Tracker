-- ============================================================
-- Vault v2.0 — Supabase Schema
-- Run this in the Supabase SQL editor (once, before app launch)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Profiles (extends Supabase auth.users) ──────────────────
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  display_name  text,
  avatar_url    text,
  role          text not null default 'member' check (role in ('owner', 'member')),
  created_at    timestamptz default now()
);

-- ── Shared movie metadata ────────────────────────────────────
create table if not exists movies (
  id            uuid primary key default uuid_generate_v4(),
  title         text not null,
  omdb_id       text unique,           -- IMDb ID e.g. tt0454876
  poster_url    text,
  year          int,
  director      text,
  runtime_min   int,
  plot          text,
  imdb_rating   numeric(3,1),
  genre_tags    text[],
  created_at    timestamptz default now()
);

-- ── Per-user ratings (the core table) ───────────────────────
create table if not exists entries (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references profiles(id) on delete cascade,
  movie_id       uuid not null references movies(id) on delete cascade,
  subgenre       text not null,
  secondary_tag  text,
  recommend      text check (recommend in ('Yes', 'No', 'Peak', 'Garbage')),
  atmosphere     numeric(3,2) check (atmosphere between 0 and 2),
  story          numeric(3,2) check (story between 0 and 2),
  characters     numeric(3,2) check (characters between 0 and 1),
  pacing         numeric(3,2) check (pacing between 0 and 1),
  visuals        numeric(3,2) check (visuals between 0 and 1),
  thrill         numeric(3,2) check (thrill between 0 and 1),
  sound          numeric(3,2) check (sound between 0 and 1),
  impact         numeric(3,2) check (impact between 0 and 1),
  bonus          int not null default 0 check (bonus in (0, 1)),
  total          numeric(4,2),
  must_watch     boolean default false,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now(),
  unique(user_id, movie_id)           -- one entry per user per film
);

-- ── Row Level Security ───────────────────────────────────────
alter table profiles enable row level security;
alter table movies   enable row level security;
alter table entries  enable row level security;

-- profiles: each user can only see/edit their own row
create policy "own_profile_select" on profiles
  for select using (auth.uid() = id);

create policy "own_profile_update" on profiles
  for update using (auth.uid() = id);

-- movies: all authenticated users can read; only service role can write
-- (INSERT/UPDATE/DELETE on movies happens via service role key in API routes)
create policy "authenticated_read_movies" on movies
  for select using (auth.role() = 'authenticated');

-- entries: users can only access their own rows
create policy "select_own_entries" on entries
  for select using (auth.uid() = user_id);

create policy "insert_own_entries" on entries
  for insert with check (auth.uid() = user_id);

create policy "update_own_entries" on entries
  for update using (auth.uid() = user_id);

create policy "delete_own_entries" on entries
  for delete using (auth.uid() = user_id);

-- ── Auto-update updated_at on entries ───────────────────────
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger entries_updated_at
  before update on entries
  for each row execute procedure update_updated_at_column();

-- ── Indexes for common query patterns ───────────────────────
create index if not exists idx_entries_user_id   on entries(user_id);
create index if not exists idx_entries_movie_id  on entries(movie_id);
create index if not exists idx_entries_created   on entries(user_id, created_at desc);
create index if not exists idx_movies_omdb_id    on movies(omdb_id);
create index if not exists idx_movies_title      on movies(lower(title));

-- ── Auto-create profile on user signup ───────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, role)
  values (
    new.id,
    -- Default to the first part of their email if username isn't provided in metadata
    lower(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'member'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Mood Cache Table (added in v3.1) ─────────────────────────────────
create table if not exists mood_cache (
  mood         text primary key,
  payload      jsonb not null,
  computed_at  timestamptz default now()
);

-- Enable RLS for security
alter table mood_cache enable row level security;

-- Allow public read access to mood_cache
create policy "Allow public read access to mood_cache" 
  on mood_cache for select 
  to public 
  using (true);

-- Allow authenticated service_role/owner full access
create policy "Allow service_role full access to mood_cache" 
  on mood_cache for all 
  to service_role 
  using (true) 
  with check (true);

