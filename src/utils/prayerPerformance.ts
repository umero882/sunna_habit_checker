/**
 * Prayer Performance Calculation Utilities
 * Calculate daily prayer scores and Barakah points
 */

import type { PrayerLog, PrayerStatus } from '../types';
import {
  PRAYER_POINTS,
  BARAKAH_POINTS,
  MAX_DAILY_PRAYER_POINTS,
  getPerformanceStatus,
  type PerformanceStatus,
} from '../constants/points';

import { createLogger } from './logger';

const logger = createLogger('prayerPerformance');

export interface DailyPerformance {
  /** Total score out of 5 (e.g., 4.5) */
  score: number;

  /** Total Barakah points earned */
  barakahPoints: number;

  /** Daily prayer points (Jamaah=27, Alone=1) */
  dailyPrayerPoints: number;

  /** Performance status (excellent/good/needs-improvement) */
  status: PerformanceStatus;

  /** Color for UI display */
  color: string;

  /** Icon for UI display */
  icon: string;

  /** Breakdown of prayers */
  breakdown: {
    onTime: number;
    delayed: number;
    missed: number;
    qadaa: number;
    jamaah: number;
    total: number;
  };
}

/**
 * Calculate points for a single prayer based on status
 * @param status - Prayer status
 * @returns Points earned (0-1)
 */
const getPrayerPoints = (status: PrayerStatus): number => {
  switch (status) {
    case 'on_time':
      return PRAYER_POINTS.ON_TIME;
    case 'delayed':
      return PRAYER_POINTS.DELAYED;
    case 'missed':
      return PRAYER_POINTS.MISSED;
    case 'qadaa':
      return PRAYER_POINTS.QADAA;
    default:
      return 0;
  }
};

/**
 * Calculate daily prayer points for a single prayer (27 for Jamaah, 1 for alone)
 * @param status - Prayer status
 * @param jamaah - Whether prayer was in congregation
 * @returns Daily prayer points earned
 */
const getDailyPrayerPoints = (status: PrayerStatus, jamaah: boolean = false): number => {
  // Only count prayers that were performed (not missed)
  if (status === 'missed') {
    return 0;
  }

  // Jamaah = 27 points, Alone = 1 point
  return jamaah ? 27 : 1;
};

/**
 * Calculate Barakah points for a single prayer
 * @param status - Prayer status
 * @param jamaah - Whether prayer was in congregation
 * @param fridaySunnah - Number of Friday Sunnah items completed
 * @returns Barakah points earned
 */
const getPrayerBarakahPoints = (
  status: PrayerStatus,
  jamaah: boolean = false,
  fridaySunnah: number = 0
): number => {
  let points = 0;

  // Base points for prayer
  switch (status) {
    case 'on_time':
      points = jamaah ? BARAKAH_POINTS.PRAYER_JAMAAH : BARAKAH_POINTS.PRAYER_ON_TIME;
      break;
    case 'delayed':
      points = BARAKAH_POINTS.PRAYER_DELAYED;
      break;
    case 'qadaa':
      points = BARAKAH_POINTS.PRAYER_QADAA;
      break;
    case 'missed':
      points = 0;
      break;
  }

  // Add Friday Sunnah bonus
  if (fridaySunnah > 0) {
    points += fridaySunnah * BARAKAH_POINTS.FRIDAY_SUNNAH_ITEM;
  }

  return points;
};

/**
 * Get performance color based on status
 * @param status - Performance status
 * @returns Hex color code
 */
export const getPerformanceColor = (status: PerformanceStatus): string => {
  switch (status) {
    case 'excellent':
      return '#4CAF50'; // Green
    case 'good':
      return '#FF9800'; // Orange/Yellow
    case 'needs-improvement':
      return '#F44336'; // Red
  }
};

/**
 * Get performance icon based on status
 * @param status - Performance status
 * @returns Emoji icon
 */
export const getPerformanceIcon = (status: PerformanceStatus): string => {
  switch (status) {
    case 'excellent':
      return '⭐';
    case 'good':
      return '👍';
    case 'needs-improvement':
      return '💪';
  }
};

/**
 * Calculate daily prayer performance from logs
 * @param logs - Today's prayer logs (should only include fajr, dhuhr, asr, maghrib, isha)
 * @returns Daily performance metrics
 */
export const calculateDailyPerformance = (logs: PrayerLog[]): DailyPerformance => {
  // Filter to only include the 5 obligatory prayers (exclude optional prayers like witr, duha, tahajjud)
  const obligatoryPrayers = logs.filter(log =>
    ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].includes(log.prayer)
  );

  // Remove duplicates - keep only the latest log for each prayer
  const uniquePrayers = obligatoryPrayers.reduce((acc, log) => {
    const existing = acc.find(l => l.prayer === log.prayer);
    if (!existing) {
      acc.push(log);
    } else {
      // Keep the most recent log (by updated_at or created_at)
      const existingTime = new Date(existing.updated_at || existing.created_at || 0).getTime();
      const currentTime = new Date(log.updated_at || log.created_at || 0).getTime();
      if (currentTime > existingTime) {
        const index = acc.indexOf(existing);
        acc[index] = log;
      }
    }
    return acc;
  }, [] as PrayerLog[]);

  logger.debug('=== Performance Calculation Debug ===');
  logger.debug('Total logs:', logs.length);
  logger.debug('Obligatory prayers:', obligatoryPrayers.length);
  logger.debug('Unique prayers:', uniquePrayers.length);
  logger.debug('Prayers:', uniquePrayers.map(l => `${l.prayer}:${l.status}`).join(', '));

  // Count prayers by status
  const breakdown = {
    onTime: 0,
    delayed: 0,
    missed: 0,
    qadaa: 0,
    jamaah: 0,
    total: uniquePrayers.length,
  };

  let totalScore = 0;
  let totalBarakahPoints = 0;
  let totalDailyPrayerPoints = 0;

  // Process each prayer log (only unique obligatory prayers)
  uniquePrayers.forEach(log => {
    // Update breakdown
    switch (log.status) {
      case 'on_time':
        breakdown.onTime++;
        break;
      case 'delayed':
        breakdown.delayed++;
        break;
      case 'missed':
        breakdown.missed++;
        break;
      case 'qadaa':
        breakdown.qadaa++;
        break;
    }

    // Track Jamaah count
    if (log.jamaah) {
      breakdown.jamaah++;
    }

    // Calculate score
    totalScore += getPrayerPoints(log.status);

    // Calculate Barakah points
    const fridaySunnahCount = log.friday_sunnah_completed?.length || 0;
    totalBarakahPoints += getPrayerBarakahPoints(log.status, log.jamaah, fridaySunnahCount);

    // Calculate daily prayer points (Jamaah=27, Alone=1)
    totalDailyPrayerPoints += getDailyPrayerPoints(log.status, log.jamaah);
  });

  // Determine performance status
  const status = getPerformanceStatus(totalScore);

  return {
    score: totalScore,
    barakahPoints: totalBarakahPoints,
    dailyPrayerPoints: totalDailyPrayerPoints,
    status,
    color: getPerformanceColor(status),
    icon: getPerformanceIcon(status),
    breakdown,
  };
};

/**
 * Format score for display (e.g., "4.5/5")
 * @param score - Raw score
 * @returns Formatted string
 */
export const formatScore = (score: number): string => {
  return `${score.toFixed(1)}/${MAX_DAILY_PRAYER_POINTS}`;
};

/**
 * Get status message based on performance
 * @param status - Performance status
 * @returns Status message
 */
export const getStatusMessage = (status: PerformanceStatus): string => {
  switch (status) {
    case 'excellent':
      return 'Excellent!';
    case 'good':
      return 'Good';
    case 'needs-improvement':
      return 'Keep Striving';
  }
};
