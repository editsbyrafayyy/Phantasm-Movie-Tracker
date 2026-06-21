-- ── Feature 4: Personal Notes ──────────────────────────────────────────────────
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- This migration adds an optional notes column to the entries table.
-- Safe to run on a live database — it only ADDs a nullable column with no default.

ALTER TABLE entries
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Optional: add a check constraint to enforce max length server-side
-- (the frontend already enforces 500 chars, this is belt-and-suspenders)
ALTER TABLE entries
  ADD CONSTRAINT entries_notes_length_check
    CHECK (notes IS NULL OR char_length(notes) <= 500);

-- Verify:
-- SELECT column_name, data_type, character_maximum_length
-- FROM information_schema.columns
-- WHERE table_name = 'entries' AND column_name = 'notes';
