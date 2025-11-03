/**
 * Core TypeScript Types & Interfaces
 * Based on Sunnah Habit Checker PRD data model
 */

// ============= User & Settings =============

/**
 * Supabase Auth User
 * Matches the structure from @supabase/supabase-js
 */
export interface User {
  id: string;
  email?: string;
  created_at?: string;
  createdAt?: string;
  user_metadata?: {
    full_name?: string;
    phone_number?: string;
    country?: string;
    avatar_url?: string;
    [key: string]: any;
  };
  app_metadata?: {
    [key: string]: any;
  };
  metadata?: {
    full_name?: string;
    phone_number?: string;
    country?: string;
    avatar_url?: string;
    [key: string]: any;
  };
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone_number: string;
  country: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  country: string;
}

export type Locale = 'en' | 'ar';
export type Madhhab = 'Standard' | 'Hanafi' | 'Maliki' | 'Shafi' | 'Hanbali';
export type AsrMethod = 'Standard' | 'Hanafi';

export interface UserSettings {
  userId: string;
  locale: Locale;
  timezone: string;
  madhhab: Madhhab;
  asrMethod: AsrMethod;
  hijriEnabled: boolean;
  barakahPointsEnabled: boolean;
  notificationsEnabled: boolean;
  quietHoursStart?: string; // HH:mm format
  quietHoursEnd?: string;
  prayerCalcMethod: string;
  prayerOffsets?: PrayerOffsets;
}

export interface PrayerOffsets {
  fajr?: number;
  dhuhr?: number;
  asr?: number;
  maghrib?: number;
  isha?: number;
}

// ============= Prayer =============

export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export type OptionalPrayer = 'witr' | 'duha' | 'tahajjud';
export type PrayerStatus = 'on_time' | 'delayed' | 'missed' | 'qadaa';
export type PrayerLocation = 'home' | 'masjid' | 'work' | 'other';

export interface PrayerTimes {
  id: string;
  userId: string;
  date: string; // ISO date
  fajr: string; // ISO datetime
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  calcMethod: string;
  offsets?: PrayerOffsets;
}

export interface PrayerLog {
  id: string;
  user_id: string; // snake_case to match database
  date: string; // ISO date
  prayer: PrayerName | OptionalPrayer;
  status: PrayerStatus;
  jamaah: boolean;
  location?: PrayerLocation;
  logged_at: string; // ISO datetime - snake_case to match database
  note?: string;
  friday_sunnah_completed?: string[]; // snake_case to match database
  created_at?: string;
  updated_at?: string;
}

export interface FridaySunnahCompletion {
  ghusl: boolean;
  earlyArrival: boolean;
  bestClothes: boolean;
  surahKahf: boolean;
  abundantSalawat: boolean;
}

export interface NextPrayerInfo {
  name: PrayerName;
  time: string; // Formatted time string (e.g., "2:30 PM")
  date: Date; // Date object for the next prayer
  timeRemaining?: string; // Optional formatted time remaining (e.g., "2h 30m")
}

// ============= Habits =============

export type HabitType = 'adhkar' | 'reading' | 'charity' | 'fasting' | 'custom';
export type HabitFrequency = 'daily' | 'weekly' | 'custom';

export interface Habit {
  id: string;
  userId: string;
  name: string;
  type: HabitType;
  description?: string;
  targetCount?: number; // e.g., 33 for tasbih
  schedule?: HabitSchedule;
  isActive: boolean;
  createdAt: string;
  order?: number; // for sorting
}

export interface HabitSchedule {
  frequency: HabitFrequency;
  anchor?: 'prayer' | 'time' | 'sunrise' | 'sunset';
  prayerAnchor?: PrayerName;
  timeAnchor?: string; // HH:mm
  offsetMinutes?: number;
  daysOfWeek?: number[]; // 0-6, Sunday = 0
}

export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  date: string; // ISO date
  counter: number;
  note?: string;
  loggedAt: string;
}

// ============= Adhkar =============

export interface AdhkarItem {
  id: string;
  textArabic: string;
  textTransliteration?: string;
  textTranslation: string;
  count: number;
  source?: string; // Hadith reference
  category: 'morning' | 'evening' | 'after_prayer' | 'sleep' | 'other';
}

export interface AdhkarLog {
  id: string;
  userId: string;
  date: string;
  category: string;
  itemsCompleted: string[]; // Array of adhkar item IDs
  loggedAt: string;
}

// ============= Qur'an Reading & Reflection =============

export type ReadingMode = 'pages' | 'verses' | 'time'; // minutes
export type RevelationType = 'Meccan' | 'Medinan';
export type ReadingTheme = 'light' | 'dark' | 'sepia';

// Reciter Information
export interface ReciterInfo {
  id: string; // e.g., "ar.alafasy"
  name: string; // e.g., "Mishary Rashid Alafasy"
  locale: string; // e.g., "Arabic"
  country?: string; // e.g., "Kuwait"
  style?: string; // Description of recitation style
}

// Surah Metadata
export interface SurahMeta {
  number: number; // 1-114
  name: string; // English name
  nameArabic: string; // Arabic name
  nameTransliteration: string; // e.g., "Al-Fatihah"
  revelationType: RevelationType;
  numberOfAyahs: number;
  numberOfPages: number; // Approximate pages in Mushaf
  juz: number[]; // Which Juz(s) this surah spans
}

// Ayah (Verse) Data
export interface Ayah {
  number: number; // Ayah number in surah
  numberInQuran: number; // Global ayah number (1-6236)
  text: string; // Arabic text
  translation?: string; // English/other language translation
  transliteration?: string; // Romanized pronunciation
  audio?: string; // Audio URL
  page?: number; // Page number in Mushaf
  juz?: number;
  manzil?: number;
  ruku?: number;
  hizbQuarter?: number;
}

// Surah with Ayahs
export interface Surah extends SurahMeta {
  ayahs: Ayah[];
}

// Reading Plans
export interface QuranPlan {
  id: string;
  user_id: string;
  name: string; // e.g., "Complete Quran in 30 Days"
  mode: ReadingMode;
  target_per_day: number;
  total_target?: number; // NULL for ongoing plans
  completed: number;
  active: boolean;
  started_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

// Reading Session Logs
export interface QuranReadingLog {
  id: string;
  user_id: string;
  date: string; // ISO date
  surah_number: number;
  from_ayah: number;
  to_ayah: number;
  duration_minutes?: number;
  pages_read?: number;
  reflection?: string;
  logged_at: string;
  created_at: string;
  updated_at: string;
}

// Reflections (Tadabbur)
export interface QuranReflection {
  id: string;
  user_id: string;
  surah_number: number;
  ayah_number?: number; // NULL for surah-level reflection
  text: string;
  mood?: number; // 1-5
  tags?: string[]; // e.g., ["patience", "gratitude"]
  date: string;
  created_at: string;
  updated_at: string;
}

// Bookmarks
export interface QuranBookmark {
  id: string;
  user_id: string;
  surah_number: number;
  ayah_number: number;
  note?: string;
  created_at: string;
}

// User Preferences
export interface UserQuranPreferences {
  user_id: string;
  translation: string; // e.g., "en.sahih"
  show_transliteration: boolean;
  font_size: number; // 12-32
  theme: ReadingTheme;
  reciter: string; // e.g., "ar.alafasy"
  playback_speed: number; // 0.5-2.0
  auto_scroll: boolean;
  daily_goal_mode: ReadingMode;
  daily_goal_value: number;
  last_surah?: number;
  last_ayah?: number;
  created_at: string;
  updated_at: string;
}

// Audio Player State
export interface AudioState {
  isPlaying: boolean;
  isLoading: boolean;
  currentAyah?: number;
  surahNumber?: number;
  duration: number;
  position: number;
  speed: number;
  reciter: string;
}

// Reading Progress & Stats
export interface QuranProgress {
  totalPagesRead: number;
  totalVersesRead: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  lastReadDate?: string;
  completionPercentage: number; // 0-100
  surahsCompleted: number;
}

// Daily Stats
export interface QuranDailyStats {
  date: string;
  pagesRead: number;
  versesRead: number;
  minutesSpent: number;
  sessionsCount: number;
  reflectionsCount: number;
}

// Plan Template
export interface PlanTemplate {
  id: string;
  name: string;
  description: string;
  mode: ReadingMode;
  targetPerDay: number;
  totalTarget?: number;
  durationDays: number;
  icon?: string;
}

// SQLite Cached Data (Offline Storage)
export interface CachedSurah {
  number: number;
  metadata: string; // JSON stringified SurahMeta
  ayahs: string; // JSON stringified Ayah[]
  translation: string; // Edition identifier
  cached_at: number; // Timestamp
}

// API Response Types
export interface AlQuranCloudSurah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: RevelationType;
}

export interface AlQuranCloudAyah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean | { id: number; recommended: boolean; obligatory: boolean };
}

export interface AlQuranCloudResponse {
  code: number;
  status: string;
  data: {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
    revelationType: RevelationType;
    ayahs: AlQuranCloudAyah[];
  };
}

// Legacy types (for compatibility)
export interface ReadingPlan extends QuranPlan {}
export interface ReadingLog extends QuranReadingLog {
  amount: number;
  fromRef?: string;
  toRef?: string;
  planId?: string;
  userId: string;
}

// ============= Charity =============

export type CharityKind = 'money' | 'time' | 'kind_deed';

export interface CharityEntry {
  id: string;
  userId: string;
  kind: CharityKind;
  amount?: number;
  currency?: string;
  minutes?: number; // for time/service
  beneficiary?: string;
  note?: string;
  isPrivate: boolean;
  createdAt: string;
  date: string; // ISO date for when charity was given
}

// ============= Reminders =============

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  body?: string;
  schedule: ReminderSchedule;
  isActive: boolean;
  createdAt: string;
}

export interface ReminderSchedule {
  type: 'fixed' | 'prayer_relative' | 'sunrise_relative' | 'sunset_relative';
  time?: string; // HH:mm for fixed
  prayer?: PrayerName;
  offsetMinutes?: number;
  repeat: 'once' | 'daily' | 'weekly' | 'custom';
  daysOfWeek?: number[];
}

// ============= Journal =============

export interface JournalEntry {
  id: string;
  userId: string;
  date: string;
  text: string;
  mood?: number; // 1-5
  khushuLevel?: number; // 1-5 for prayer quality
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// ============= Sunnah Habits & Benchmarks =============

export type SunnahLevel = 'basic' | 'companion' | 'prophetic';
export type SunnahCategoryName =
  | 'Prayer'
  | 'Dhikr'
  | 'Charity'
  | 'Quran'
  | 'Fasting'
  | 'Lifestyle'
  | 'Social';

export interface SunnahCategory {
  id: string;
  name: SunnahCategoryName;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  icon: string | null;
  display_order: number;
  created_at: string;
}

export interface SunnahHabit {
  id: string;
  category_id: string;
  name: string;
  name_ar: string | null;
  description: string;
  description_ar: string | null;

  // Hadith/Qur'an source
  source: string;
  source_ar: string | null;
  hadith_ref: string | null;
  arabic_ref: string | null;

  // 3-Tier Benchmarks
  tier_basic: string;
  tier_companion: string;
  tier_prophetic: string;
  tier_basic_ar: string | null;
  tier_companion_ar: string | null;
  tier_prophetic_ar: string | null;

  // Benefits & Educational Content
  benefits: string[] | null;
  benefits_ar: string[] | null;

  // Display & Organization
  icon: string | null;
  display_order: number;
  is_featured: boolean;
  is_active: boolean;

  // Metadata
  content_version: number;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SunnahLog {
  id: string;
  user_id: string;
  habit_id: string;
  date: string; // ISO date
  level: SunnahLevel;
  reflection: string | null;
  logged_at: string;
  created_at: string;
  updated_at: string;
}

export interface UserSunnahPreferences {
  user_id: string;
  daily_recommendation_count: number; // 3-10, default 5
  pinned_habits: string[]; // Array of habit IDs
  goal_levels: Record<string, SunnahLevel>; // { "prayer": "companion", "charity": "basic", ... }
  reminder_enabled: boolean;
  reminder_time: string; // HH:mm format
  created_at: string;
  updated_at: string;
}

export type SunnahMilestoneType =
  | 'streak_7'
  | 'streak_30'
  | 'streak_100'
  | 'level_upgrade'
  | 'category_complete'
  | 'first_log';

export interface SunnahMilestone {
  id: string;
  user_id: string;
  habit_id: string | null;
  type: SunnahMilestoneType;
  value: number | null; // e.g., streak count
  level: SunnahLevel | null;
  category_id: string | null;
  achieved_at: string;
}

// ============= Sunnah Display & UI Types =============

export interface SunnahHabitWithCategory extends SunnahHabit {
  category: SunnahCategory;
}

export interface SunnahHabitWithLog extends SunnahHabit {
  category: SunnahCategory;
  todayLog: SunnahLog | null;
  currentStreak: number;
  isPinned: boolean;
}

export interface SunnahDayStats {
  totalHabits: number;
  habitsCompleted: number;
  completionPercentage: number;
  basicCount: number;
  companionCount: number;
  propheticCount: number;
}

export interface SunnahCategoryProgress {
  category: SunnahCategory;
  totalHabits: number;
  completed: number;
  percentage: number;
  habits: SunnahHabitWithLog[];
}

export interface SunnahInsights {
  weeklyCompletion: number; // percentage
  favoriteCategory: SunnahCategoryName | null;
  currentStreak: number;
  longestStreak: number;
  totalMilestones: number;
  recentMilestones: SunnahMilestone[];
  levelDistribution: {
    basic: number;
    companion: number;
    prophetic: number;
  };
  topHabits: Array<{
    habit: SunnahHabit;
    completionCount: number;
    currentLevel: SunnahLevel;
  }>;
}

// ============= Barakah Points (Optional) =============

export interface PointsConfig {
  enabled: boolean;
  basePoints: {
    prayerOnTime: number;
    prayerJamaah: number;
    qadaa: number;
    adhkar: number;
    quranPage: number;
    charity: number;
    fasting: number;
  };
  multipliers: {
    consistency7Day: number;
    reflection: number;
    jamaah: number;
  };
}

export interface DailyPoints {
  userId: string;
  date: string;
  total: number;
  breakdown: {
    prayers: number;
    adhkar: number;
    quran: number;
    charity: number;
    other: number;
  };
}

// ============= Analytics & Insights =============

export interface PrayerStats {
  totalPrayers: number;
  onTimeCount: number;
  jamaahCount: number;
  currentStreak: number;
  longestStreak: number;
  onTimePercentage: number;
  qadaaBacklog: number;
}

export interface WeeklyOverview {
  weekStart: string;
  weekEnd: string;
  prayerStats: PrayerStats;
  habitsCompleted: number;
  quranPagesRead: number;
  charityTotal?: number;
  charityCurrency?: string;
  topHabits: Array<{ habitId: string; count: number }>;
  suggestedFocus?: string;
}

// ============= API Response Types =============

export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============= Navigation Types =============

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  Auth: undefined;
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
  ResetPassword: undefined;
  LocationPermission: undefined;
  Qibla: undefined;
  Backup: undefined;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  FeaturesPrayer: undefined;
  FeaturesQuran: undefined;
  FeaturesSunnah: undefined;
  Permissions: undefined;
  PrayerSettings: undefined;
  QuranPreferences: undefined;
  Complete: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  PrayersTab: undefined;
  SunnahTab: undefined;
  QuranTab: undefined;
  ProfileTab: undefined;
};

export type PrayerStackParamList = {
  PrayerList: undefined;
  PrayerLog: { prayer: PrayerName; date?: string };
  PrayerDetails: { prayerId: string };
  QadaaTracker: undefined;
  Qibla: undefined;
};

export type HabitStackParamList = {
  HabitList: undefined;
  HabitDetails: { habitId: string };
  AddHabit: { type?: HabitType };
  AdhkarChecklist: { category: string };
  QuranReader: undefined;
  CharityLog: undefined;
};
