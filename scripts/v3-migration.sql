-- ============================================================
-- Vault v3.0 — Schema Migration
-- Run this in the Supabase SQL editor AFTER the v2 schema.
-- Safe to run multiple times (uses IF NOT EXISTS / DROP IF EXISTS).
-- ============================================================

-- ── Step 1: Add new columns to movies table ──────────────────
alter table movies
  add column if not exists tmdb_id      int unique,
  add column if not exists backdrop_url text,
  add column if not exists cast_list    text[],
  add column if not exists media_type   text default 'movie'
    check (media_type in ('movie', 'tv'));

-- ── Step 2: New indexes ──────────────────────────────────────
create index if not exists idx_movies_tmdb_id    on movies(tmdb_id);
create index if not exists idx_movies_media_type on movies(media_type);

-- ── Step 3: Update RLS — make movies readable by everyone ────
-- (Needed so unauthenticated public browse page can load posters)
drop policy if exists "authenticated_read_movies" on movies;
create policy "public_read_movies" on movies
  for select using (true);

-- ── Step 4: Allow anonymous read of owner's entries ──────────
-- This makes the owner's vault publicly browsable.
-- Replace the UUID below with OWNER_USER_ID from your .env.local.
-- The existing select_own_entries policy still applies for members.
drop policy if exists "public_read_owner_entries" on entries;
create policy "public_read_owner_entries" on entries
  for select using (
    user_id = '69a94e3f-bcb8-4eb2-884f-98fe2b5fdcd0'::uuid
    or auth.uid() = user_id
  );

-- NOTE: Drop the old entries select policy and replace it with the one above.
-- The new policy covers BOTH cases: own entries (members) + owner entries (public).
drop policy if exists "select_own_entries" on entries;

-- ── Step 5: Allow anonymous read of owner's profile ──────────
drop policy if exists "public_read_owner_profile" on profiles;
create policy "public_read_owner_profile" on profiles
  for select using (
    id = '69a94e3f-bcb8-4eb2-884f-98fe2b5fdcd0'::uuid
    or auth.uid() = id
  );

-- NOTE: Drop the old profile policy and replace with the one above.
drop policy if exists "own_profile_select" on profiles;
