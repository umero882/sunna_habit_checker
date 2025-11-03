-- Migration: Add unique constraint to prayer_logs
-- Ensures no duplicate prayer logs for the same user, date, and prayer
-- This prevents the issue where score shows 5.0/5 when only 4 prayers are logged

-- First, clean up any existing duplicates
-- Keep the most recent log for each (user_id, date, prayer) combination
DO $$
DECLARE
  duplicate_record RECORD;
BEGIN
  -- Find and delete duplicate prayer logs, keeping only the most recent one
  FOR duplicate_record IN
    SELECT user_id, date, prayer
    FROM prayer_logs
    GROUP BY user_id, date, prayer
    HAVING COUNT(*) > 1
  LOOP
    -- Delete all but the most recent log for this combination
    DELETE FROM prayer_logs
    WHERE (user_id, date, prayer) = (duplicate_record.user_id, duplicate_record.date, duplicate_record.prayer)
      AND id NOT IN (
        SELECT id
        FROM prayer_logs
        WHERE user_id = duplicate_record.user_id
          AND date = duplicate_record.date
          AND prayer = duplicate_record.prayer
        ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
        LIMIT 1
      );
  END LOOP;
END $$;

-- Now add the unique constraint to prevent future duplicates
ALTER TABLE prayer_logs
ADD CONSTRAINT prayer_logs_user_date_prayer_unique
UNIQUE (user_id, date, prayer);

-- Create an index to improve query performance
CREATE INDEX IF NOT EXISTS idx_prayer_logs_unique ON prayer_logs(user_id, date, prayer);
