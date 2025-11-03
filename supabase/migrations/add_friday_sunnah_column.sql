-- Migration: Add Friday Sunnah tracking to prayer_logs table
-- Date: 2025-10-31
-- Description: Adds a JSON column to track which Friday Sunnah practices were completed

-- Add friday_sunnah_completed column to prayer_logs
ALTER TABLE prayer_logs
ADD COLUMN IF NOT EXISTS friday_sunnah_completed jsonb DEFAULT '[]'::jsonb;

-- Add comment to explain the column
COMMENT ON COLUMN prayer_logs.friday_sunnah_completed IS
'Array of Friday Sunnah practice IDs completed (e.g., ["ghusl", "early_arrival", "surah_kahf"])';

-- Create index for better query performance on JSON column
CREATE INDEX IF NOT EXISTS idx_prayer_logs_friday_sunnah
ON prayer_logs USING GIN (friday_sunnah_completed);
