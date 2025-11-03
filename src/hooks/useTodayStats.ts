/**
 * useTodayStats Hook
 * Aggregates all daily statistics for prayers, Quran, Sunnah, and charity
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePrayerLogs } from './usePrayerLogs';
import { useSunnahHabits } from './useSunnahHabits';
import { useQuranPreferences } from './useQuranPreferences';
import { supabase } from '../services/supabase';
import { calculateDailyStats, type DailyStats } from '../utils/habitAggregation';
import { format } from 'date-fns';
import type { QuranReadingLog } from '../types';

import { createLogger } from '../utils/logger';

const logger = createLogger('useTodayStats');

export interface UseTodayStatsReturn {
  stats: DailyStats;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to get aggregated daily statistics
 * Combines data from prayers, Quran reading, Sunnah habits, and charity
 *
 * @param date - Date to get stats for (default: today)
 * @returns Daily statistics
 *
 * @example
 * const { stats, isLoading, refresh } = useTodayStats();
 * // stats.prayer.completionPercentage -> 80
 * // stats.quran.pagesRead -> 5
 * // stats.sunnah.habitsCompleted -> 3
 */
export function useTodayStats(date?: Date): UseTodayStatsReturn {
  // Update date string daily
  const [dateString, setDateString] = useState(() => format(date || new Date(), 'yyyy-MM-dd'));

  // Update date string when day changes
  useEffect(() => {
    const updateDate = () => {
      const newDateString = format(date || new Date(), 'yyyy-MM-dd');
      if (newDateString !== dateString) {
        logger.debug(`📅 Date changed from ${dateString} to ${newDateString}, updating stats...`);
        setDateString(newDateString);
      }
    };

    // Check for date change every minute
    const interval = setInterval(updateDate, 60000);

    // Also check immediately
    updateDate();

    return () => clearInterval(interval);
  }, [date, dateString]);

  // Fetch prayer logs for the date (disable autoRefresh to prevent infinite loops)
  const {
    logs: prayerLogs,
    isLoading: prayerLoading,
    error: prayerError,
    refreshLogs,
  } = usePrayerLogs({ date: dateString, autoRefresh: false });

  // Fetch Sunnah habits for the date
  const {
    recommendedHabits,
    isLoading: sunnahLoading,
    error: sunnahError,
    refresh: refreshSunnah,
  } = useSunnahHabits({ date: dateString });

  // Fetch Quran reading logs directly
  const {
    data: readingLogs = [],
    isLoading: quranLogsLoading,
    error: quranLogsError,
    refetch: refetchQuranLogs,
  } = useQuery({
    queryKey: ['quranReadingLogs'],
    queryFn: async (): Promise<QuranReadingLog[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('quran_reading_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        logger.error('Error fetching Quran reading logs:', error);
        throw error;
      }

      return data || [];
    },
    staleTime: 1000 * 60, // 1 minute
    retry: 1,
  });

  // Fetch Quran preferences for daily target
  const {
    preferences: quranPreferences,
    isLoading: quranPrefsLoading,
    refetch: refetchQuranPrefs,
  } = useQuranPreferences();

  // Compute loading directly from source values
  const isLoading = prayerLoading || sunnahLoading || quranLogsLoading || quranPrefsLoading;

  // Compute error directly from source values (convert Error objects to strings)
  const error = prayerError || sunnahError || (quranLogsError ? String(quranLogsError) : null);

  // Calculate stats using useMemo instead of useEffect to prevent infinite loops
  const stats = useMemo(() => {
    try {
      // Get daily target from Quran preferences
      const dailyTarget = quranPreferences?.dailyGoalValue || 2;

      // Debug logging for Quran
      if (__DEV__) {
        logger.debug('[useTodayStats] Quran Debug:', {
          readingLogsCount: readingLogs.length,
          dailyTarget,
          hasPreferences: !!quranPreferences,
        });
      }

      // Calculate daily stats with Quran data
      const dailyStats = calculateDailyStats(prayerLogs, {
        quranReadingLogs: readingLogs,
        quranDailyTarget: dailyTarget,
        date: date || new Date(),
      });

      // Override Sunnah stats with actual data
      const habitsCompleted = recommendedHabits.filter(h => h.todayLog).length;
      const totalHabits = recommendedHabits.length;

      // Debug logging
      if (__DEV__) {
        logger.debug('[useTodayStats] Sunnah Debug:', {
          recommendedHabitsCount: recommendedHabits.length,
          habitsCompleted,
          totalHabits,
          percentage: totalHabits > 0 ? Math.round((habitsCompleted / totalHabits) * 100) : 0,
        });
      }

      dailyStats.sunnah = {
        habitsCompleted,
        totalHabits,
        completionPercentage: totalHabits > 0 ? Math.round((habitsCompleted / totalHabits) * 100) : 0,
      };

      return dailyStats;
    } catch (err: any) {
      logger.error('Error calculating stats:', err);
      // Return empty stats on error
      return calculateDailyStats([], { date: date || new Date() });
    }
  }, [prayerLogs, recommendedHabits, readingLogs, quranPreferences, date]);

  // Refresh all data
  const refresh = useCallback(async () => {
    await Promise.all([
      refreshLogs(),
      refreshSunnah(),
      refetchQuranLogs(),
      refetchQuranPrefs(),
    ]);
    // TODO: Refresh Charity data when hook available
    // Note: isLoading and error are derived from source hooks,
    // so they will update automatically when those hooks refresh
  }, [refreshLogs, refreshSunnah, refetchQuranLogs, refetchQuranPrefs]);

  return {
    stats,
    isLoading,
    error,
    refresh,
  };
}

/**
 * Hook to get only prayer completion percentage
 * Lightweight alternative when you only need prayer stats
 *
 * @returns Prayer completion percentage (0-100)
 */
export function usePrayerCompletion(): number {
  const { stats } = useTodayStats();
  return stats.prayer.completionPercentage;
}

/**
 * Hook to get overall completion percentage across all categories
 *
 * @returns Overall completion percentage (0-100)
 */
export function useOverallCompletion(): number {
  const { stats } = useTodayStats();

  const percentages = [
    stats.prayer.completionPercentage,
    stats.quran.completionPercentage,
    stats.sunnah.completionPercentage,
    stats.charity.hasEntry ? 100 : 0,
  ];

  const total = percentages.reduce((sum, p) => sum + p, 0);
  return Math.round(total / percentages.length);
}
