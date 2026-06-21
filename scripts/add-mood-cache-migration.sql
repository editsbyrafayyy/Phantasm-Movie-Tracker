-- SQL migration to create the mood_cache table
-- Execute this script in your Supabase Dashboard SQL Editor

CREATE TABLE IF NOT EXISTS mood_cache (
  mood TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for security
ALTER TABLE mood_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access to mood_cache
CREATE POLICY "Allow public read access to mood_cache" 
ON mood_cache FOR SELECT 
TO public 
USING (true);

-- Allow authenticated service_role/owner full access (automatic via service role, but good to define)
CREATE POLICY "Allow service_role full access to mood_cache" 
ON mood_cache FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);
