/**
 * useQuranStatistics Hook
 * Fetches and calculates comprehensive reading statistics
 */

import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

import { createLogger } from '../utils/logger';

const logger = createLogger('useQuranStatistics');

interface QuranStatistics {
  currentStreak: number;
  longestStreak: number;
  totalPagesRead: number;
  totalVersesRead: number;
  totalMinutesRead: number;
  surahsCompleted: number;
  thisWeek: {
    pagesRead: number;
    minutesRead: number;
    daysActive: number;
  };
  thisMonth: {
    pagesRead: number;
    minutesRead: number;
    daysActive: number;
  };
  completionPercentage: number;
}

interface UseQuranStatisticsReturn {
  statistics: QuranStatistics | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const TOTAL_QURAN_PAGES = 604;
const TOTAL_QURAN_VERSES = 6236;

export const useQuranStatistics = (userId?: string): UseQuranStatisticsReturn => {
  const [statistics, setStatistics] = useState<QuranStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Calculate streak from reading logs
   */
  const calculateStreak = (logs: any[]): { current: number; longest: number } => {
    if (!logs || logs.length === 0) return { current: 0, longest: 0 };

    // Sort by date descending
    const sortedLogs = [...logs].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Get unique dates
    const uniqueDates = Array.from(new Set(sortedLogs.map(log => log.date)));

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date().toISOString().split('T')[0];
    let checkDate = new Date(today);

    // Calculate current streak
    for (const dateStr of uniqueDates) {
      const logDate = checkDate.toISOString().split('T')[0];

      if (uniqueDates.includes(logDate)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate longest streak
    for (let i = 0; i < uniqueDates.length; i++) {
      const currentDate = new Date(uniqueDates[i]);

      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(uniqueDates[i - 1]);
        const daysDiff = (prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);

        if (daysDiff === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }

      longestStreak = Math.max(longestStreak, tempStreak);
    }

    return { current: currentStreak, longest: longestStreak };
  };

  /**
   * Get date range for this week
   */
  const getThisWeekRange = (): { start: string; end: string } => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const start = new Date(today);
    start.setDate(today.getDate() - dayOfWeek);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  };

  /**
   * Get date range for this month
   */
  const getThisMonthRange = (): { start: string; end: string } => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  };

  /**
   * Calculate Surahs completed
   */
  const calculateSurahsCompleted = (logs: any[]): number => {
    const { SURAHS } = require('../constants/quran');

    // Group logs by surah
    const surahProgress: Record<number, Set<number>> = {};

    logs.forEach(log => {
      if (!surahProgress[log.surah_number]) {
        surahProgress[log.surah_number] = new Set();
      }

      // Add all ayahs in the range
      for (let ayah = log.from_ayah; ayah <= log.to_ayah; ayah++) {
        surahProgress[log.surah_number].add(ayah);
      }
    });

    // Count completed surahs
    let completed = 0;
    Object.entries(surahProgress).forEach(([surahNum, ayahsRead]) => {
      const surah = SURAHS.find((s: any) => s.number === parseInt(surahNum));
      if (surah && ayahsRead.size >= surah.numberOfAyahs) {
        completed++;
      }
    });

    return completed;
  };

  /**
   * Fetch and calculate statistics
   */
  const fetchStatistics = async () => {
    if (!userId) {
      setStatistics(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch all reading logs
      const { data: allLogs, error: logsError } = await supabase
        .from('quran_reading_logs')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (logsError) throw logsError;

      if (!allLogs || allLogs.length === 0) {
        // No logs yet - return zeros
        setStatistics({
          currentStreak: 0,
          longestStreak: 0,
          totalPagesRead: 0,
          totalVersesRead: 0,
          totalMinutesRead: 0,
          surahsCompleted: 0,
          thisWeek: { pagesRead: 0, minutesRead: 0, daysActive: 0 },
          thisMonth: { pagesRead: 0, minutesRead: 0, daysActive: 0 },
          completionPercentage: 0,
        });
        setIsLoading(false);
        return;
      }

      // Calculate streaks
      const streaks = calculateStreak(allLogs);

      // Calculate totals
      // Round page totals since old logs may have decimal values, but pages should be integers
      const totalPagesRead = Math.round(allLogs.reduce((sum, log) => sum + (log.pages_read || 0), 0));
      const totalMinutesRead = allLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);

      // Calculate verses read
      const totalVersesRead = allLogs.reduce((sum, log) => {
        const versesInLog = (log.to_ayah - log.from_ayah) + 1;
        return sum + versesInLog;
      }, 0);

      // Calculate Surahs completed
      const surahsCompleted = calculateSurahsCompleted(allLogs);

      // Calculate completion percentage
      const completionPercentage = Math.min(100, (totalPagesRead / TOTAL_QURAN_PAGES) * 100);

      // This week stats
      const weekRange = getThisWeekRange();
      const weekLogs = allLogs.filter(log =>
        log.date >= weekRange.start && log.date <= weekRange.end
      );
      const weekPagesRead = Math.round(weekLogs.reduce((sum, log) => sum + (log.pages_read || 0), 0));
      const weekMinutesRead = weekLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
      const weekDaysActive = new Set(weekLogs.map(log => log.date)).size;

      // This month stats
      const monthRange = getThisMonthRange();
      const monthLogs = allLogs.filter(log =>
        log.date >= monthRange.start && log.date <= monthRange.end
      );
      const monthPagesRead = Math.round(monthLogs.reduce((sum, log) => sum + (log.pages_read || 0), 0));
      const monthMinutesRead = monthLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
      const monthDaysActive = new Set(monthLogs.map(log => log.date)).size;

      setStatistics({
        currentStreak: streaks.current,
        longestStreak: streaks.longest,
        totalPagesRead,
        totalVersesRead,
        totalMinutesRead,
        surahsCompleted,
        thisWeek: {
          pagesRead: weekPagesRead,
          minutesRead: weekMinutesRead,
          daysActive: weekDaysActive,
        },
        thisMonth: {
          pagesRead: monthPagesRead,
          minutesRead: monthMinutesRead,
          daysActive: monthDaysActive,
        },
        completionPercentage,
      });

      setIsLoading(false);
    } catch (err) {
      logger.error('Failed to fetch Quran statistics:', err);
      setError(err as Error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [userId]);

  return {
    statistics,
    isLoading,
    error,
    refresh: fetchStatistics,
  };
};

export default useQuranStatistics;
