-- User Progress Snapshots Table
-- Stores weekly aggregated progress data for analytics and charts

CREATE TABLE IF NOT EXISTS user_progress_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_start date NOT NULL,
  prayers_on_time integer DEFAULT 0,
  quran_minutes integer DEFAULT 0,
  sunnah_completed integer DEFAULT 0,
  charity_entries integer DEFAULT 0,
  level_distribution jsonb DEFAULT '{"basic": 0, "companion": 0, "prophetic": 0}'::jsonb,
  reflection_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Enable RLS
ALTER TABLE user_progress_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own progress snapshots"
  ON user_progress_snapshots
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress snapshots"
  ON user_progress_snapshots
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress snapshots"
  ON user_progress_snapshots
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_progress_snapshots_user_week
  ON user_progress_snapshots(user_id, week_start DESC);

-- Function to generate current week snapshot
CREATE OR REPLACE FUNCTION generate_week_snapshot(p_user_id uuid, p_week_start date)
RETURNS user_progress_snapshots AS $$
DECLARE
  v_snapshot user_progress_snapshots;
  v_week_end date;
BEGIN
  v_week_end := p_week_start + interval '6 days';

  -- Calculate prayers on time
  SELECT COUNT(*) INTO v_snapshot.prayers_on_time
  FROM prayer_logs
  WHERE user_id = p_user_id
    AND date BETWEEN p_week_start AND v_week_end
    AND status = 'on_time';

  -- Calculate Quran minutes
  SELECT COALESCE(SUM(duration_minutes), 0) INTO v_snapshot.quran_minutes
  FROM quran_reading_logs
  WHERE user_id = p_user_id
    AND date BETWEEN p_week_start AND v_week_end;

  -- Calculate Sunnah completed
  SELECT COUNT(*) INTO v_snapshot.sunnah_completed
  FROM sunnah_logs
  WHERE user_id = p_user_id
    AND date BETWEEN p_week_start AND v_week_end;

  -- Calculate charity entries
  SELECT COUNT(*) INTO v_snapshot.charity_entries
  FROM charity_entries
  WHERE user_id = p_user_id
    AND date BETWEEN p_week_start AND v_week_end;

  -- Calculate level distribution
  SELECT
    jsonb_build_object(
      'basic', COUNT(*) FILTER (WHERE level = 'basic'),
      'companion', COUNT(*) FILTER (WHERE level = 'companion'),
      'prophetic', COUNT(*) FILTER (WHERE level = 'prophetic')
    ) INTO v_snapshot.level_distribution
  FROM sunnah_logs
  WHERE user_id = p_user_id
    AND date BETWEEN p_week_start AND v_week_end;

  -- Calculate reflection count
  SELECT COUNT(*) INTO v_snapshot.reflection_count
  FROM journal_entries
  WHERE user_id = p_user_id
    AND date BETWEEN p_week_start AND v_week_end;

  -- Set other fields
  v_snapshot.id := gen_random_uuid();
  v_snapshot.user_id := p_user_id;
  v_snapshot.week_start := p_week_start;
  v_snapshot.created_at := now();

  -- Insert or update snapshot
  INSERT INTO user_progress_snapshots (
    id, user_id, week_start, prayers_on_time, quran_minutes,
    sunnah_completed, charity_entries, level_distribution, reflection_count
  ) VALUES (
    v_snapshot.id, v_snapshot.user_id, v_snapshot.week_start,
    v_snapshot.prayers_on_time, v_snapshot.quran_minutes,
    v_snapshot.sunnah_completed, v_snapshot.charity_entries,
    v_snapshot.level_distribution, v_snapshot.reflection_count
  )
  ON CONFLICT (user_id, week_start)
  DO UPDATE SET
    prayers_on_time = EXCLUDED.prayers_on_time,
    quran_minutes = EXCLUDED.quran_minutes,
    sunnah_completed = EXCLUDED.sunnah_completed,
    charity_entries = EXCLUDED.charity_entries,
    level_distribution = EXCLUDED.level_distribution,
    reflection_count = EXCLUDED.reflection_count,
    created_at = now()
  RETURNING * INTO v_snapshot;

  RETURN v_snapshot;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION generate_week_snapshot(uuid, date) TO authenticated;
