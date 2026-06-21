-- ── Feature 1: Watchlist / Watch Later ─────────────────────────────────────────
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- Creates a watchlist table so any authenticated user can save TMDB movies to watch later.

CREATE TABLE IF NOT EXISTS watchlist (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tmdb_id    INTEGER NOT NULL,
  media_type TEXT    NOT NULL DEFAULT 'movie',  -- 'movie' | 'tv'
  title      TEXT    NOT NULL,
  poster_url TEXT,
  year       INTEGER,
  added_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, tmdb_id, media_type)
);

-- Enable RLS
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- Users can only read their own watchlist items
CREATE POLICY "watchlist_select_own"
  ON watchlist FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own items
CREATE POLICY "watchlist_insert_own"
  ON watchlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own items
CREATE POLICY "watchlist_delete_own"
  ON watchlist FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast per-user queries
CREATE INDEX IF NOT EXISTS watchlist_user_id_idx ON watchlist (user_id, added_at DESC);

-- Verify:
-- SELECT * FROM watchlist LIMIT 5;
