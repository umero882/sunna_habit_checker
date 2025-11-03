/**
 * useQuranProgress Hook
 * Tracks Qur'an reading statistics, streaks, and achievements
 */

import { useState, useEffect, useCallback } from 'react';
import { QuranProgress, QuranDailyStats } from '../types';
import { supabase } from '../services/supabase';
import { format, subDays, differenceInDays } from 'date-fns';

import { createLogger } from '../utils/logger';

const logger = createLogger('useQuranProgress');

interface UseQuranProgressReturn {
  progress: QuranProgress | null;
  dailyStats: QuranDailyStats[];
  isLoading: boolean;
  error: Error | null;
  refreshProgress: () => Promise<void>;
  getWeeklyStats: () => Promise<QuranDailyStats[]>;
  getMonthlyStats: () => Promise<QuranDailyStats[]>;
}

export const useQuranProgress = (userId?: string): UseQuranProgressReturn => {
  const [progress, setProgress] = useState<QuranProgress | null>(null);
  const [dailyStats, setDailyStats] = useState<QuranDailyStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Calculate reading streak
   */
  const calculateStreak = useCallback(async (): Promise<{ current: number; longest: number }> => {
    if (!userId) return { current: 0, longest: 0 };

    try {
      const { data, error: fetchError } = await supabase
        .from('quran_reading_logs')
        .select('date')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (fetchError) throw fetchError;

      if (!data || data.length === 0) {
        return { current: 0, longest: 0 };
      }

      // Get unique dates
      const uniqueDates = [...new Set(data.map((log) => log.date))].sort().reverse();

      // Calculate current streak
      let currentStreak = 0;
      const today = format(new Date(), 'yyyy-MM-dd');
      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

      // Check if user read today or yesterday (to allow for continuation)
      if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
        currentStreak = 1;
        let checkDate = uniqueDates[0] === today ? yesterday : format(subDays(new Date(uniqueDates[0]), 1), 'yyyy-MM-dd');

        for (let i = 1; i < uniqueDates.length; i++) {
          if (uniqueDates[i] === checkDate) {
            currentStreak++;
            checkDate = format(subDays(new Date(checkDate), 1), 'yyyy-MM-dd');
          } else {
            break;
          }
        }
      }

      // Calculate longest streak
      let longestStreak = 0;
      let tempStreak = 1;

      for (let i = 1; i < uniqueDates.length; i++) {
        const daysDiff = differenceInDays(new Date(uniqueDates[i - 1]), new Date(uniqueDates[i]));

        if (daysDiff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }

      longestStreak = Math.max(longestStreak, tempStreak);

      return { current: currentStreak, longest: longestStreak };
    } catch (err) {
      logger.error('Error calculating streak:', err);
      return { current: 0, longest: 0 };
    }
  }, [userId]);

  /**
   * Calculate overall progress
   */
  const calculateProgress = useCallback(async (): Promise<QuranProgress | null> => {
    if (!userId) return null;

    try {
      const { data, error: fetchError } = await supabase
        .from('quran_reading_logs')
        .select('*')
        .eq('user_id', userId);

      if (fetchError) throw fetchError;

      if (!data || data.length === 0) {
        return {
          totalPagesRead: 0,
          totalVersesRead: 0,
          totalMinutes: 0,
          currentStreak: 0,
          longestStreak: 0,
          completionPercentage: 0,
          surahsCompleted: 0,
        };
      }

      // Calculate totals
      // Round page totals since old logs may have decimal values, but pages should be integers
      const totalPagesRead = Math.round(data.reduce((sum, log) => sum + (log.pages_read || 0), 0));
      const totalVersesRead = data.reduce(
        (sum, log) => sum + (log.to_ayah - log.from_ayah + 1),
        0
      );
      const totalMinutes = data.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);

      // Get streaks
      const { current, longest } = await calculateStreak();

      // Calculate completion percentage (based on 604 pages in standard Mushaf)
      const completionPercentage = Math.min((totalPagesRead / 604) * 100, 100);

      // Get last read date
      const lastLog = data.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];
      const lastReadDate = lastLog?.date;

      // Count completed surahs (simplified - would need more logic for actual completion)
      const surahSet = new Set(data.map((log) => log.surah_number));
      const surahsCompleted = surahSet.size;

      return {
        totalPagesRead,
        totalVersesRead,
        totalMinutes,
        currentStreak: current,
        longestStreak: longest,
        lastReadDate,
        completionPercentage,
        surahsCompleted,
      };
    } catch (err) {
      logger.error('Error calculating progress:', err);
      return null;
    }
  }, [userId, calculateStreak]);

  /**
   * Get daily stats for a date range
   */
  const getDailyStats = useCallback(
    async (startDate: Date, endDate: Date): Promise<QuranDailyStats[]> => {
      if (!userId) return [];

      try {
        const { data, error: fetchError } = await supabase
          .from('quran_reading_logs')
          .select('*')
          .eq('user_id', userId)
          .gte('date', format(startDate, 'yyyy-MM-dd'))
          .lte('date', format(endDate, 'yyyy-MM-dd'))
          .order('date', { ascending: true });

        if (fetchError) throw fetchError;

        // Group by date
        const statsByDate = new Map<string, QuranDailyStats>();

        data?.forEach((log) => {
          const existing = statsByDate.get(log.date);

          if (existing) {
            existing.pagesRead = Math.round(existing.pagesRead + (log.pages_read || 0));
            existing.versesRead += log.to_ayah - log.from_ayah + 1;
            existing.minutesSpent += log.duration_minutes || 0;
            existing.sessionsCount += 1;
            if (log.reflection) {
              existing.reflectionsCount += 1;
            }
          } else {
            statsByDate.set(log.date, {
              date: log.date,
              pagesRead: Math.round(log.pages_read || 0),
              versesRead: log.to_ayah - log.from_ayah + 1,
              minutesSpent: log.duration_minutes || 0,
              sessionsCount: 1,
              reflectionsCount: log.reflection ? 1 : 0,
            });
          }
        });

        return Array.from(statsByDate.values());
      } catch (err) {
        logger.error('Error getting daily stats:', err);
        return [];
      }
    },
    [userId]
  );

  /**
   * Get weekly stats
   */
  const getWeeklyStats = useCallback(async (): Promise<QuranDailyStats[]> => {
    const endDate = new Date();
    const startDate = subDays(endDate, 7);
    return await getDailyStats(startDate, endDate);
  }, [getDailyStats]);

  /**
   * Get monthly stats
   */
  const getMonthlyStats = useCallback(async (): Promise<QuranDailyStats[]> => {
    const endDate = new Date();
    const startDate = subDays(endDate, 30);
    return await getDailyStats(startDate, endDate);
  }, [getDailyStats]);

  /**
   * Refresh all progress data
   */
  const refreshProgress = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [progressData, weeklyData] = await Promise.all([
        calculateProgress(),
        getWeeklyStats(),
      ]);

      setProgress(progressData);
      setDailyStats(weeklyData);
    } catch (err) {
      logger.error('Error refreshing progress:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [calculateProgress, getWeeklyStats]);

  /**
   * Load progress on mount
   */
  useEffect(() => {
    if (userId) {
      refreshProgress();
    }
  }, [userId, refreshProgress]);

  return {
    progress,
    dailyStats,
    isLoading,
    error,
    refreshProgress,
    getWeeklyStats,
    getMonthlyStats,
  };
};

export default useQuranProgress;
