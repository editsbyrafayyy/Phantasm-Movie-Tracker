-- ============================================================
-- Migration v5.0 — Numeric 2 Decimal Places Support
-- Run this in the Supabase SQL editor
-- ============================================================

ALTER TABLE entries ALTER COLUMN atmosphere TYPE numeric(3,2);
ALTER TABLE entries ALTER COLUMN story TYPE numeric(3,2);
ALTER TABLE entries ALTER COLUMN characters TYPE numeric(3,2);
ALTER TABLE entries ALTER COLUMN pacing TYPE numeric(3,2);
ALTER TABLE entries ALTER COLUMN visuals TYPE numeric(3,2);
ALTER TABLE entries ALTER COLUMN thrill TYPE numeric(3,2);
ALTER TABLE entries ALTER COLUMN sound TYPE numeric(3,2);
ALTER TABLE entries ALTER COLUMN impact TYPE numeric(3,2);
