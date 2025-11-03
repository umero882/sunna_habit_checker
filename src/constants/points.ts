/**
 * Barakah Points Configuration
 * Based on authentic Islamic sources and scholarly consensus
 */

/**
 * Prayer Points Configuration
 * Based on user-specified requirements and Islamic principles
 */
export const PRAYER_POINTS = {
  /** Prayer performed on time - full point */
  ON_TIME: 1,

  /** Prayer performed but delayed - half point */
  DELAYED: 0.5,

  /** Prayer missed (not yet made up) - no point */
  MISSED: 0,

  /** Qadaa prayer with acceptable reason (sleep, forgetfulness) - full point */
  QADAA: 1,
} as const;

/**
 * Jamaah (Congregation) Multiplier
 * Based on authentic hadith: Prayer in congregation is 27 times better
 * Source: Sahih al-Bukhari 645, Sahih Muslim 650
 */
export const JAMAAH_MULTIPLIER = 27;

/**
 * Maximum daily prayer points (5 obligatory prayers)
 */
export const MAX_DAILY_PRAYER_POINTS = 5;

/**
 * Barakah Points Base Values
 * These are spiritual reward points for tracking spiritual growth
 */
export const BARAKAH_POINTS = {
  /** Base points for prayer on time */
  PRAYER_ON_TIME: 10,

  /** Base points for prayer with jamaah */
  PRAYER_JAMAAH: 270, // 10 × 27 (jamaah multiplier)

  /** Base points for delayed prayer */
  PRAYER_DELAYED: 5,

  /** Base points for qadaa prayer */
  PRAYER_QADAA: 10,

  /** Additional points for Friday Sunnah practices */
  FRIDAY_SUNNAH_ITEM: 5,
} as const;

/**
 * Maximum Daily Prayer Rewards (Benchmark)
 * 5 prayers × 27 (Jamaah multiplier) × 10 (base points) = 1,350 points
 * This represents the ideal scenario: all 5 prayers on time in Jamaah
 */
export const MAX_DAILY_BARAKAH_POINTS = 5 * BARAKAH_POINTS.PRAYER_JAMAAH; // 1,350

/**
 * Maximum Daily Prayer Points (Simple Calculation)
 * 5 prayers × 27 (Jamaah multiplier) = 135 points
 * Used for daily prayer rewards display
 */
export const MAX_DAILY_PRAYER_POINTS_SIMPLE = 5 * JAMAAH_MULTIPLIER; // 135

/**
 * Performance Status Thresholds
 * Based on daily prayer score (out of 5)
 */
export const PERFORMANCE_THRESHOLDS = {
  /** Excellent performance: 90%+ (4.5-5 points) */
  EXCELLENT: 4.5,

  /** Good performance: 60-89% (3.0-4.4 points) */
  GOOD: 3.0,

  /** Needs improvement: <60% (<3.0 points) */
  // Below GOOD threshold
} as const;

/**
 * Performance Status Type
 */
export type PerformanceStatus = 'excellent' | 'good' | 'needs-improvement';

/**
 * Get performance status based on score
 * @param score - Daily prayer score (0-5)
 * @returns Performance status
 */
export const getPerformanceStatus = (score: number): PerformanceStatus => {
  if (score >= PERFORMANCE_THRESHOLDS.EXCELLENT) {
    return 'excellent';
  } else if (score >= PERFORMANCE_THRESHOLDS.GOOD) {
    return 'good';
  } else {
    return 'needs-improvement';
  }
};
