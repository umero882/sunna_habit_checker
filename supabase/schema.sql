-- Sunnah Habit Checker Database Schema
-- Based on PRD Section 7: Data Model

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============= SETTINGS =============

CREATE TABLE settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  locale text DEFAULT 'en' CHECK (locale IN ('en', 'ar')),
  timezone text DEFAULT 'Asia/Dubai',
  madhhab text DEFAULT 'Standard',
  asr_method text DEFAULT 'Standard' CHECK (asr_method IN ('Standard', 'Hanafi')),
  hijri_enabled boolean DEFAULT false,
  barakah_points_enabled boolean DEFAULT false,
  notifications_enabled boolean DEFAULT true,
  quiet_hours_start time,
  quiet_hours_end time,
  prayer_calc_method text DEFAULT 'MuslimWorldLeague',
  prayer_offsets jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Settings policies
CREATE POLICY "Users can view their own settings"
  ON settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON settings FOR UPDATE
  USING (auth.uid() = user_id);

-- ============= PRAYERS =============

CREATE TABLE prayers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  fajr timestamptz NOT NULL,
  sunrise timestamptz NOT NULL,
  dhuhr timestamptz NOT NULL,
  asr timestamptz NOT NULL,
  maghrib timestamptz NOT NULL,
  isha timestamptz NOT NULL,
  calc_method text,
  offsets jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE prayers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own prayer times"
  ON prayers FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_prayers_user_date ON prayers(user_id, date DESC);

-- ============= PRAYER LOGS =============

CREATE TABLE prayer_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  prayer text NOT NULL CHECK (prayer IN ('fajr','dhuhr','asr','maghrib','isha','witr','duha','tahajjud')),
  status text NOT NULL CHECK (status IN ('on_time','delayed','missed','qadaa')),
  jamaah boolean DEFAULT false,
  location text CHECK (location IN ('home','masjid','work','other')),
  note text,
  logged_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE prayer_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own prayer logs"
  ON prayer_logs FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_prayer_logs_user_date ON prayer_logs(user_id, date DESC);
CREATE INDEX idx_prayer_logs_prayer ON prayer_logs(prayer);

-- ============= HABITS =============

CREATE TABLE habits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('adhkar','reading','charity','fasting','custom')),
  description text,
  target_count integer,
  schedule jsonb,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own habits"
  ON habits FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_habits_user_active ON habits(user_id, is_active);

-- ============= HABIT LOGS =============

CREATE TABLE habit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id uuid REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  counter integer DEFAULT 1,
  note text,
  logged_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own habit logs"
  ON habit_logs FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_habit_logs_habit_date ON habit_logs(habit_id, date DESC);
CREATE INDEX idx_habit_logs_user_date ON habit_logs(user_id, date DESC);

-- ============= ADHKAR =============

CREATE TABLE adhkar_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  text_arabic text NOT NULL,
  text_transliteration text,
  text_translation text NOT NULL,
  count integer DEFAULT 1,
  source text,
  category text NOT NULL CHECK (category IN ('morning','evening','after_prayer','sleep','other')),
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Adhkar templates are public read
ALTER TABLE adhkar_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view adhkar templates"
  ON adhkar_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE TABLE adhkar_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  category text NOT NULL,
  items_completed jsonb DEFAULT '[]',
  logged_at timestamptz DEFAULT now()
);

ALTER TABLE adhkar_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own adhkar logs"
  ON adhkar_logs FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_adhkar_logs_user_date ON adhkar_logs(user_id, date DESC);

-- ============= READING PLANS =============

CREATE TABLE reading_plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mode text NOT NULL CHECK (mode IN ('pages','verses','time')),
  target_per_day integer NOT NULL,
  total_target integer,
  active boolean DEFAULT true,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reading_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own reading plans"
  ON reading_plans FOR ALL
  USING (auth.uid() = user_id);

CREATE TABLE reading_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id uuid REFERENCES reading_plans(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  amount integer NOT NULL,
  from_ref text,
  to_ref text,
  logged_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reading_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own reading logs"
  ON reading_logs FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_reading_logs_user_date ON reading_logs(user_id, date DESC);
CREATE INDEX idx_reading_logs_plan ON reading_logs(plan_id);

-- ============= CHARITY =============

CREATE TABLE charity_entries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  kind text NOT NULL CHECK (kind IN ('money','time','kind_deed')),
  amount numeric,
  currency text DEFAULT 'USD',
  minutes integer,
  beneficiary text,
  note text,
  is_private boolean DEFAULT false,
  date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE charity_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own charity entries"
  ON charity_entries FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_charity_user_date ON charity_entries(user_id, date DESC);

-- ============= REMINDERS =============

CREATE TABLE reminders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  body text,
  schedule jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own reminders"
  ON reminders FOR ALL
  USING (auth.uid() = user_id);

-- ============= JOURNAL =============

CREATE TABLE journal_entries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  text text NOT NULL,
  mood integer CHECK (mood BETWEEN 1 AND 5),
  khushu_level integer CHECK (khushu_level BETWEEN 1 AND 5),
  tags jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own journal entries"
  ON journal_entries FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_journal_user_date ON journal_entries(user_id, date DESC);

-- ============= SUNNAH BENCHMARKS =============

CREATE TABLE sunnah_benchmarks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  title_ar text,
  description text NOT NULL,
  description_ar text,
  source text NOT NULL,
  category text NOT NULL CHECK (category IN ('prayer','fasting','charity','adhkar','character','other')),
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Benchmarks are public read
ALTER TABLE sunnah_benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sunnah benchmarks"
  ON sunnah_benchmarks FOR SELECT
  TO authenticated
  USING (true);

-- User's pinned benchmarks
CREATE TABLE user_pinned_benchmarks (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  benchmark_id uuid REFERENCES sunnah_benchmarks(id) ON DELETE CASCADE NOT NULL,
  pinned_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, benchmark_id)
);

ALTER TABLE user_pinned_benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own pinned benchmarks"
  ON user_pinned_benchmarks FOR ALL
  USING (auth.uid() = user_id);

-- ============= FUNCTIONS =============

-- Function to automatically create settings on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create settings on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prayer_logs_updated_at BEFORE UPDATE ON prayer_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON habits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_charity_entries_updated_at BEFORE UPDATE ON charity_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON reminders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
