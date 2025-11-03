/**
 * Habit Aggregation Utilities
 * Calculate daily statistics and completion percentages
 */

import { format, isToday, parseISO } from 'date-fns';
import type { PrayerLog, PrayerStatus, QuranReadingLog } from '../types';

/**
 * Prayer completion statistics for a given date
 */
export interface PrayerDayStats {
  total: number; // Total prayers in a day (5)
  completed: number; // Prayers logged as on_time, delayed, or qadaa
  onTime: number; // Prayers prayed on time
  completionPercentage: number; // completed / total * 100
  onTimePercentage: number; // onTime / total * 100
}

/**
 * Daily statistics across all habit types
 */
export interface DailyStats {
  prayer: PrayerDayStats;
  quran: {
    pagesRead: number;
    minutesRead: number;
    targetPages?: number;
    completionPercentage: number;
  };
  sunnah: {
    habitsCompleted: number;
    totalHabits: number;
    completionPercentage: number;
  };
  charity: {
    entriesCount: number;
    hasEntry: boolean;
  };
}

/**
 * Calculate prayer statistics for a given date
 *
 * @param logs - Prayer logs for the date
 * @returns Prayer statistics
 */
export function calculatePrayerStats(logs: PrayerLog[]): PrayerDayStats {
  const total = 5; // 5 obligatory prayers per day

  // Count completed prayers (on_time, delayed, or qadaa)
  const completed = logs.filter((log) =>
    ['on_time', 'delayed', 'qadaa'].includes(log.status)
  ).length;

  // Count prayers prayed on time
  const onTime = logs.filter((log) => log.status === 'on_time').length;

  return {
    total,
    completed,
    onTime,
    completionPercentage: Math.round((completed / total) * 100),
    onTimePercentage: Math.round((onTime / total) * 100),
  };
}

/**
 * Calculate Quran reading statistics from reading logs
 *
 * @param readingLogs - All reading logs for the user
 * @param dailyTarget - Daily target pages (from reading plan, default 2)
 * @param date - Date to calculate for (default: today)
 * @returns Quran reading statistics
 */
export function calculateQuranStats(
  readingLogs: QuranReadingLog[] = [],
  dailyTarget: number = 2,
  date: Date = new Date()
): DailyStats['quran'] {
  const dateString = format(date, 'yyyy-MM-dd');

  // Filter logs for the specified date
  const todayLogs = readingLogs.filter((log) => {
    // Handle both Date objects and ISO strings
    const logDate = typeof log.date === 'string' ? log.date : format(new Date(log.date), 'yyyy-MM-dd');
    return logDate === dateString;
  });

  // Calculate pages read
  const pagesRead = todayLogs.reduce((total, log) => {
    return total + (log.pages_read || 0);
  }, 0);

  // Calculate minutes read
  const minutesRead = todayLogs.reduce((total, log) => {
    return total + (log.duration_minutes || 0);
  }, 0);

  // Calculate completion percentage
  const completionPercentage = dailyTarget > 0
    ? Math.min(100, Math.round((pagesRead / dailyTarget) * 100))
    : 0;

  return {
    pagesRead,
    minutesRead,
    targetPages: dailyTarget,
    completionPercentage,
  };
}

/**
 * Calculate Sunnah habits statistics (placeholder - to be implemented with real data)
 *
 * @param date - Date to calculate for
 * @returns Sunnah habits statistics
 */
export function calculateSunnahStats(date: Date = new Date()): DailyStats['sunnah'] {
  // TODO: Implement with actual HabitLog data when available
  // For now, return placeholder data
  return {
    habitsCompleted: 0,
    totalHabits: 0,
    completionPercentage: 0,
  };
}

/**
 * Calculate charity statistics (placeholder - to be implemented with real data)
 *
 * @param date - Date to calculate for
 * @returns Charity statistics
 */
export function calculateCharityStats(date: Date = new Date()): DailyStats['charity'] {
  // TODO: Implement with actual CharityEntry data when available
  // For now, return placeholder data
  return {
    entriesCount: 0,
    hasEntry: false,
  };
}

/**
 * Calculate overall daily statistics
 *
 * @param prayerLogs - Prayer logs for the date
 * @param options - Optional parameters
 * @param options.quranReadingLogs - Quran reading logs
 * @param options.quranDailyTarget - Daily target pages for Quran
 * @param options.date - Date to calculate for (default: today)
 * @returns Complete daily statistics
 */
export function calculateDailyStats(
  prayerLogs: PrayerLog[],
  options: {
    quranReadingLogs?: QuranReadingLog[];
    quranDailyTarget?: number;
    date?: Date;
  } = {}
): DailyStats {
  const { quranReadingLogs = [], quranDailyTarget = 2, date = new Date() } = options;

  return {
    prayer: calculatePrayerStats(prayerLogs),
    quran: calculateQuranStats(quranReadingLogs, quranDailyTarget, date),
    sunnah: calculateSunnahStats(date),
    charity: calculateCharityStats(date),
  };
}

/**
 * Get overall completion percentage (average across all categories)
 *
 * @param stats - Daily statistics
 * @returns Overall completion percentage (0-100)
 */
export function getOverallCompletionPercentage(stats: DailyStats): number {
  const percentages = [
    stats.prayer.completionPercentage,
    stats.quran.completionPercentage,
    stats.sunnah.completionPercentage,
    stats.charity.hasEntry ? 100 : 0,
  ];

  const total = percentages.reduce((sum, p) => sum + p, 0);
  return Math.round(total / percentages.length);
}

/**
 * Get streak information for prayers
 * (Returns 0 for now, to be implemented with historical data)
 *
 * @returns Current prayer streak (consecutive days)
 */
export function getPrayerStreak(): number {
  // TODO: Implement with historical prayer data
  return 0;
}

/**
 * Get formatted summary text for today's progress
 *
 * @param stats - Daily statistics
 * @returns Human-readable summary
 *
 * @example
 * // Returns: "3 prayers logged • 5 pages read • 2 habits"
 */
export function getDailySummary(stats: DailyStats): string {
  const parts: string[] = [];

  if (stats.prayer.completed > 0) {
    parts.push(`${stats.prayer.completed} prayer${stats.prayer.completed !== 1 ? 's' : ''}`);
  }

  if (stats.quran.pagesRead > 0) {
    parts.push(`${stats.quran.pagesRead} page${stats.quran.pagesRead !== 1 ? 's' : ''} read`);
  }

  if (stats.sunnah.habitsCompleted > 0) {
    parts.push(`${stats.sunnah.habitsCompleted} habit${stats.sunnah.habitsCompleted !== 1 ? 's' : ''}`);
  }

  if (stats.charity.hasEntry) {
    parts.push('charity given');
  }

  return parts.length > 0 ? parts.join(' • ') : 'No activities logged yet';
}
