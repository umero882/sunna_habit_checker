-- Qur'an Reading & Reflection Module
-- Database schema for user reading logs, plans, and reflections

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============= QURAN READING LOGS =============

CREATE TABLE quran_reading_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,

  -- Reading reference
  surah_number int NOT NULL CHECK (surah_number BETWEEN 1 AND 114),
  from_ayah int NOT NULL,
  to_ayah int NOT NULL,

  -- Session metrics
  duration_minutes int, -- Time spent reading
  pages_read decimal(4,2), -- Pages count (can be fractional)

  -- Metadata
  reflection text, -- Optional reflection note
  logged_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE quran_reading_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own Quran reading logs"
  ON quran_reading_logs FOR ALL
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_quran_reading_logs_user_date ON quran_reading_logs(user_id, date DESC);
CREATE INDEX idx_quran_reading_logs_surah ON quran_reading_logs(surah_number);

-- ============= QURAN READING PLANS =============

CREATE TABLE quran_plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Plan configuration
  name text NOT NULL, -- e.g., "Complete Quran in 30 Days", "Daily 5 Pages"
  mode text NOT NULL CHECK (mode IN ('pages', 'verses', 'time')), -- Reading mode
  target_per_day int NOT NULL, -- Target amount per day (pages/verses/minutes)
  total_target int, -- Total completion target (NULL for ongoing)

  -- Progress tracking
  completed int DEFAULT 0, -- Current progress
  active boolean DEFAULT true,

  -- Timestamps
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz, -- When plan was completed
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE quran_plans ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own Quran plans"
  ON quran_plans FOR ALL
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_quran_plans_user_active ON quran_plans(user_id, active);

-- ============= QURAN REFLECTIONS =============

CREATE TABLE quran_reflections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Quranic reference
  surah_number int NOT NULL CHECK (surah_number BETWEEN 1 AND 114),
  ayah_number int, -- NULL if reflection is for entire surah

  -- Reflection content
  text text NOT NULL,
  mood int CHECK (mood BETWEEN 1 AND 5), -- Optional mood rating
  tags text[], -- Tags for categorization (e.g., "patience", "gratitude")

  -- Metadata
  date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE quran_reflections ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own Quran reflections"
  ON quran_reflections FOR ALL
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_quran_reflections_user_date ON quran_reflections(user_id, date DESC);
CREATE INDEX idx_quran_reflections_surah ON quran_reflections(surah_number);
CREATE INDEX idx_quran_reflections_tags ON quran_reflections USING gin(tags);

-- ============= QURAN BOOKMARKS =============

CREATE TABLE quran_bookmarks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Bookmark location
  surah_number int NOT NULL CHECK (surah_number BETWEEN 1 AND 114),
  ayah_number int NOT NULL,

  -- Metadata
  note text, -- Optional note for the bookmark
  created_at timestamptz DEFAULT now(),

  -- Unique constraint: one bookmark per verse per user
  UNIQUE(user_id, surah_number, ayah_number)
);

-- Enable RLS
ALTER TABLE quran_bookmarks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own Quran bookmarks"
  ON quran_bookmarks FOR ALL
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_quran_bookmarks_user ON quran_bookmarks(user_id, created_at DESC);

-- ============= USER QURAN PREFERENCES =============

CREATE TABLE user_quran_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Reading preferences
  translation text DEFAULT 'en.sahih', -- Translation edition
  show_transliteration boolean DEFAULT false,
  font_size int DEFAULT 18 CHECK (font_size BETWEEN 12 AND 32),
  theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'sepia')),

  -- Audio preferences
  reciter text DEFAULT 'ar.alafasy', -- Reciter identifier
  playback_speed decimal(3,2) DEFAULT 1.0 CHECK (playback_speed BETWEEN 0.5 AND 2.0),
  auto_scroll boolean DEFAULT true, -- Auto-scroll during audio

  -- Reading goal
  daily_goal_mode text DEFAULT 'pages' CHECK (daily_goal_mode IN ('pages', 'verses', 'time')),
  daily_goal_value int DEFAULT 2,

  -- Last reading position (resume from)
  last_surah int CHECK (last_surah BETWEEN 1 AND 114),
  last_ayah int,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_quran_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own Quran preferences"
  ON user_quran_preferences FOR ALL
  USING (auth.uid() = user_id);

-- ============= HELPER FUNCTIONS =============

-- Function to calculate reading streak
CREATE OR REPLACE FUNCTION calculate_quran_reading_streak(p_user_id uuid)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
  streak_count int := 0;
  check_date date := CURRENT_DATE;
BEGIN
  LOOP
    -- Check if user has reading log for check_date
    IF EXISTS (
      SELECT 1 FROM quran_reading_logs
      WHERE user_id = p_user_id AND date = check_date
    ) THEN
      streak_count := streak_count + 1;
      check_date := check_date - interval '1 day';
    ELSE
      EXIT;
    END IF;
  END LOOP;

  RETURN streak_count;
END;
$$;

-- Function to get plan progress percentage
CREATE OR REPLACE FUNCTION get_plan_progress(p_plan_id uuid)
RETURNS decimal(5,2)
LANGUAGE plpgsql
AS $$
DECLARE
  v_completed int;
  v_total int;
BEGIN
  SELECT completed, total_target INTO v_completed, v_total
  FROM quran_plans
  WHERE id = p_plan_id;

  IF v_total IS NULL OR v_total = 0 THEN
    RETURN 0;
  END IF;

  RETURN ROUND((v_completed::decimal / v_total) * 100, 2);
END;
$$;

-- ============= TRIGGERS FOR UPDATED_AT =============

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quran_reading_logs_updated_at
  BEFORE UPDATE ON quran_reading_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quran_plans_updated_at
  BEFORE UPDATE ON quran_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quran_reflections_updated_at
  BEFORE UPDATE ON quran_reflections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_quran_preferences_updated_at
  BEFORE UPDATE ON user_quran_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
