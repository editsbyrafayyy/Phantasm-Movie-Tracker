-- Migration: Add lists and list_items tables for Custom Film Stacks
-- Run this script in your Supabase SQL Editor

-- 1. Create lists table
CREATE TABLE IF NOT EXISTS lists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  is_public   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create list_items table
CREATE TABLE IF NOT EXISTS list_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id     UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  movie_id    UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(list_id, movie_id)
);

-- 3. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_lists_user_id ON lists(user_id);
CREATE INDEX IF NOT EXISTS idx_list_items_list_id ON list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_list_items_movie_id ON list_items(movie_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for lists
CREATE POLICY "Public lists are viewable by everyone" ON lists
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own lists" ON lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lists" ON lists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lists" ON lists
  FOR DELETE USING (auth.uid() = user_id);

-- 6. RLS Policies for list_items
CREATE POLICY "List items are viewable if list is viewable" ON list_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_items.list_id
      AND (lists.is_public = true OR lists.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert items into their own lists" ON list_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_items.list_id
      AND lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items in their own lists" ON list_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_items.list_id
      AND lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items from their own lists" ON list_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = list_items.list_id
      AND lists.user_id = auth.uid()
    )
  );
