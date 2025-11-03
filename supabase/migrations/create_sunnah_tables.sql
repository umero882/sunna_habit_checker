-- Sunnah Habits & Benchmarks Database Schema
-- Migration: Create Sunnah tracking tables with 3-tier benchmark system
-- Created: 2025-11-01

-- ============= SUNNAH CATEGORIES =============

CREATE TABLE sunnah_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  name_ar text,
  description text,
  description_ar text,
  icon text, -- Icon name for UI
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE sunnah_categories ENABLE ROW LEVEL SECURITY;

-- Categories are public (read-only for all authenticated users)
CREATE POLICY "Anyone can view sunnah categories"
  ON sunnah_categories FOR SELECT
  USING (true);

-- ============= SUNNAH HABITS =============

CREATE TABLE sunnah_habits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id uuid REFERENCES sunnah_categories(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  name_ar text,
  description text NOT NULL,
  description_ar text,

  -- Hadith/Qur'an source
  source text NOT NULL, -- e.g., "Sahih Bukhari #1178"
  source_ar text,
  hadith_ref text, -- Full hadith reference
  arabic_ref text, -- Arabic text of the hadith

  -- 3-Tier Benchmarks
  tier_basic text NOT NULL, -- Description of basic level
  tier_companion text NOT NULL, -- Description of companion level
  tier_prophetic text NOT NULL, -- Description of prophetic level
  tier_basic_ar text,
  tier_companion_ar text,
  tier_prophetic_ar text,

  -- Benefits & Educational Content
  benefits text[], -- Array of benefit descriptions
  benefits_ar text[],

  -- Display & Organization
  icon text, -- Emoji or icon name
  display_order integer DEFAULT 0,
  is_featured boolean DEFAULT false, -- For highlighting specific habits
  is_active boolean DEFAULT true,

  -- Metadata
  content_version integer DEFAULT 1, -- For tracking content updates
  verified_by text, -- Scholar name/institution (placeholder)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE sunnah_habits ENABLE ROW LEVEL SECURITY;

-- Habits are public (read-only for all authenticated users)
CREATE POLICY "Anyone can view sunnah habits"
  ON sunnah_habits FOR SELECT
  USING (is_active = true);

-- Create indexes for performance
CREATE INDEX idx_sunnah_habits_category ON sunnah_habits(category_id);
CREATE INDEX idx_sunnah_habits_featured ON sunnah_habits(is_featured) WHERE is_featured = true;
CREATE INDEX idx_sunnah_habits_active ON sunnah_habits(is_active) WHERE is_active = true;

-- ============= SUNNAH LOGS =============

CREATE TABLE sunnah_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  habit_id uuid REFERENCES sunnah_habits(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,

  -- Tracking Level
  level text NOT NULL CHECK (level IN ('basic', 'companion', 'prophetic')),

  -- Optional Reflection/Notes
  reflection text,

  -- Metadata
  logged_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Unique constraint: one log per habit per day per user
  UNIQUE(user_id, habit_id, date)
);

-- Enable RLS
ALTER TABLE sunnah_logs ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own logs
CREATE POLICY "Users can view their own sunnah logs"
  ON sunnah_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sunnah logs"
  ON sunnah_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sunnah logs"
  ON sunnah_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sunnah logs"
  ON sunnah_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_sunnah_logs_user_date ON sunnah_logs(user_id, date DESC);
CREATE INDEX idx_sunnah_logs_habit_date ON sunnah_logs(habit_id, date DESC);
CREATE INDEX idx_sunnah_logs_level ON sunnah_logs(level);

-- ============= USER SUNNAH PREFERENCES =============

CREATE TABLE user_sunnah_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Daily recommended count (3-5 habits per day)
  daily_recommendation_count integer DEFAULT 5 CHECK (daily_recommendation_count BETWEEN 3 AND 10),

  -- Favorite/pinned habits
  pinned_habits uuid[] DEFAULT '{}', -- Array of habit IDs

  -- Goal levels for categories
  goal_levels jsonb DEFAULT '{}', -- { "prayer": "companion", "charity": "basic", ... }

  -- Notification preferences
  reminder_enabled boolean DEFAULT true,
  reminder_time time DEFAULT '08:00', -- When to send daily recommendations

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_sunnah_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own preferences
CREATE POLICY "Users can manage their own sunnah preferences"
  ON user_sunnah_preferences FOR ALL
  USING (auth.uid() = user_id);

-- ============= SUNNAH MILESTONES =============
-- Track user achievements and unlocks

CREATE TABLE sunnah_milestones (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  habit_id uuid REFERENCES sunnah_habits(id) ON DELETE CASCADE,

  -- Milestone Type
  type text NOT NULL CHECK (type IN ('streak_7', 'streak_30', 'streak_100', 'level_upgrade', 'category_complete', 'first_log')),

  -- Milestone Details
  value integer, -- e.g., streak count
  level text CHECK (level IN ('basic', 'companion', 'prophetic')),
  category_id uuid REFERENCES sunnah_categories(id),

  -- Achievement date
  achieved_at timestamptz DEFAULT now(),

  -- Unique constraint
  UNIQUE(user_id, habit_id, type)
);

-- Enable RLS
ALTER TABLE sunnah_milestones ENABLE ROW LEVEL SECURITY;

-- Users can only view their own milestones
CREATE POLICY "Users can view their own milestones"
  ON sunnah_milestones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert milestones"
  ON sunnah_milestones FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_sunnah_milestones_user ON sunnah_milestones(user_id, achieved_at DESC);
CREATE INDEX idx_sunnah_milestones_type ON sunnah_milestones(type);

-- ============= FUNCTIONS =============

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_sunnah_habits_updated_at BEFORE UPDATE ON sunnah_habits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sunnah_logs_updated_at BEFORE UPDATE ON sunnah_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_sunnah_preferences_updated_at BEFORE UPDATE ON user_sunnah_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============= VIEWS FOR ANALYTICS =============

-- View: Daily Sunnah Stats per User
CREATE OR REPLACE VIEW user_daily_sunnah_stats AS
SELECT
  user_id,
  date,
  COUNT(*) as habits_logged,
  COUNT(*) FILTER (WHERE level = 'basic') as basic_count,
  COUNT(*) FILTER (WHERE level = 'companion') as companion_count,
  COUNT(*) FILTER (WHERE level = 'prophetic') as prophetic_count
FROM sunnah_logs
GROUP BY user_id, date;

-- View: Sunnah Streaks per Habit per User
CREATE OR REPLACE VIEW user_sunnah_streaks AS
WITH daily_logs AS (
  SELECT
    user_id,
    habit_id,
    date,
    ROW_NUMBER() OVER (PARTITION BY user_id, habit_id ORDER BY date) as rn,
    date - (ROW_NUMBER() OVER (PARTITION BY user_id, habit_id ORDER BY date))::integer as grp
  FROM sunnah_logs
)
SELECT
  user_id,
  habit_id,
  COUNT(*) as streak_length,
  MIN(date) as streak_start,
  MAX(date) as streak_end
FROM daily_logs
GROUP BY user_id, habit_id, grp;

-- Comments for documentation
COMMENT ON TABLE sunnah_categories IS 'Categories for organizing Sunnah habits (Prayer, Dhikr, Charity, etc.)';
COMMENT ON TABLE sunnah_habits IS 'Master list of Sunnah practices with 3-tier benchmarks and authentic sources';
COMMENT ON TABLE sunnah_logs IS 'User tracking logs for Sunnah habits with level and reflection';
COMMENT ON TABLE user_sunnah_preferences IS 'User preferences for Sunnah recommendations and goals';
COMMENT ON TABLE sunnah_milestones IS 'User achievements and milestone tracking';
