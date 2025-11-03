/**
 * Prayer Statistics Hook
 * Provides comprehensive prayer statistics including streaks, weekly/monthly stats
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, differenceInDays } from 'date-fns';
import type { PrayerLog, PrayerName } from '../types';

import { createLogger } from '../utils/logger';

const logger = createLogger('usePrayerStats');

export interface DayStats {
  date: string;
  totalPrayers: number;
  prayersLogged: number;
  onTime: number;
  delayed: number;
  missed: number;
  jamaah: number;
  completion: number; // percentage
}

export interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  totalPrayers: number;
  prayersLogged: number;
  onTimePercentage: number;
  jamaahPercentage: number;
  completionPercentage: number;
  bestDay: { date: string; completion: number } | null;
  worstDay: { date: string; completion: number } | null;
}

export interface MonthlyStats {
  monthStart: string;
  monthEnd: string;
  totalPrayers: number;
  prayersLogged: number;
  onTimePercentage: number;
  jamaahPercentage: number;
  completionPercentage: number;
  bestWeek: { start: string; end: string; completion: number } | null;
  dailyAverage: number;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastPrayedDate: string | null;
}

export interface PrayerStatsData {
  daily: DayStats[];
  weekly: WeeklyStats;
  monthly: MonthlyStats;
  streak: StreakInfo;
  heatmapData: { date: string; count: number; level: number }[];
}

interface UsePrayerStatsOptions {
  days?: number; // Number of days to fetch (default: 30)
}

export const usePrayerStats = (options: UsePrayerStatsOptions = {}) => {
  const { days = 30 } = options;

  const [stats, setStats] = useState<PrayerStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Calculate daily stats from logs
   */
  const calculateDailyStats = (logs: PrayerLog[], date: string): DayStats => {
    const dayLogs = logs.filter(log => log.date === date);
    const totalPrayers = 5; // Fajr, Dhuhr, Asr, Maghrib, Isha
    const prayersLogged = dayLogs.length;
    const onTime = dayLogs.filter(log => log.status === 'on_time').length;
    const delayed = dayLogs.filter(log => log.status === 'delayed').length;
    const missed = dayLogs.filter(log => log.status === 'missed').length;
    const jamaah = dayLogs.filter(log => log.jamaah === true).length;
    const completion = totalPrayers > 0 ? Math.round((prayersLogged / totalPrayers) * 100) : 0;

    return {
      date,
      totalPrayers,
      prayersLogged,
      onTime,
      delayed,
      missed,
      jamaah,
      completion,
    };
  };

  /**
   * Calculate streak information
   */
  const calculateStreak = (dailyStats: DayStats[]): StreakInfo => {
    if (dailyStats.length === 0) {
      return { currentStreak: 0, longestStreak: 0, lastPrayedDate: null };
    }

    // Sort by date descending
    const sorted = [...dailyStats].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastPrayedDate: string | null = null;

    // Find last prayed date
    const lastPrayed = sorted.find(day => day.prayersLogged > 0);
    if (lastPrayed) {
      lastPrayedDate = lastPrayed.date;
    }

    // Calculate current streak (consecutive days with 100% completion)
    const today = format(new Date(), 'yyyy-MM-dd');
    let expectedDate = new Date(today);

    for (const day of sorted) {
      const dayDate = format(new Date(day.date), 'yyyy-MM-dd');
      const expected = format(expectedDate, 'yyyy-MM-dd');

      if (dayDate === expected && day.completion === 100) {
        currentStreak++;
        expectedDate = subDays(expectedDate, 1);
      } else if (dayDate === expected) {
        // Today but not complete yet - don't break streak
        if (dayDate === today) {
          expectedDate = subDays(expectedDate, 1);
          continue;
        }
        break;
      }
    }

    // Calculate longest streak
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].completion === 100) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    return {
      currentStreak,
      longestStreak,
      lastPrayedDate,
    };
  };

  /**
   * Calculate weekly stats
   */
  const calculateWeeklyStats = (dailyStats: DayStats[]): WeeklyStats => {
    const now = new Date();
    const weekStart = format(startOfWeek(now, { weekStartsOn: 0 }), 'yyyy-MM-dd');
    const weekEnd = format(endOfWeek(now, { weekStartsOn: 0 }), 'yyyy-MM-dd');

    const weekLogs = dailyStats.filter(
      day => day.date >= weekStart && day.date <= weekEnd
    );

    const totalPrayers = weekLogs.reduce((sum, day) => sum + day.totalPrayers, 0);
    const prayersLogged = weekLogs.reduce((sum, day) => sum + day.prayersLogged, 0);
    const onTimeCount = weekLogs.reduce((sum, day) => sum + day.onTime, 0);
    const jamaahCount = weekLogs.reduce((sum, day) => sum + day.jamaah, 0);

    const onTimePercentage = prayersLogged > 0 ? Math.round((onTimeCount / prayersLogged) * 100) : 0;
    const jamaahPercentage = prayersLogged > 0 ? Math.round((jamaahCount / prayersLogged) * 100) : 0;
    const completionPercentage = totalPrayers > 0 ? Math.round((prayersLogged / totalPrayers) * 100) : 0;

    // Find best and worst days
    const sortedByCompletion = [...weekLogs].sort((a, b) => b.completion - a.completion);
    const bestDay = sortedByCompletion[0] ? { date: sortedByCompletion[0].date, completion: sortedByCompletion[0].completion } : null;
    const worstDay = sortedByCompletion[sortedByCompletion.length - 1]
      ? { date: sortedByCompletion[sortedByCompletion.length - 1].date, completion: sortedByCompletion[sortedByCompletion.length - 1].completion }
      : null;

    return {
      weekStart,
      weekEnd,
      totalPrayers,
      prayersLogged,
      onTimePercentage,
      jamaahPercentage,
      completionPercentage,
      bestDay,
      worstDay,
    };
  };

  /**
   * Calculate monthly stats
   */
  const calculateMonthlyStats = (dailyStats: DayStats[]): MonthlyStats => {
    const now = new Date();
    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

    const monthLogs = dailyStats.filter(
      day => day.date >= monthStart && day.date <= monthEnd
    );

    const totalPrayers = monthLogs.reduce((sum, day) => sum + day.totalPrayers, 0);
    const prayersLogged = monthLogs.reduce((sum, day) => sum + day.prayersLogged, 0);
    const onTimeCount = monthLogs.reduce((sum, day) => sum + day.onTime, 0);
    const jamaahCount = monthLogs.reduce((sum, day) => sum + day.jamaah, 0);

    const onTimePercentage = prayersLogged > 0 ? Math.round((onTimeCount / prayersLogged) * 100) : 0;
    const jamaahPercentage = prayersLogged > 0 ? Math.round((jamaahCount / prayersLogged) * 100) : 0;
    const completionPercentage = totalPrayers > 0 ? Math.round((prayersLogged / totalPrayers) * 100) : 0;
    const dailyAverage = monthLogs.length > 0 ? Number((prayersLogged / monthLogs.length).toFixed(1)) : 0;

    return {
      monthStart,
      monthEnd,
      totalPrayers,
      prayersLogged,
      onTimePercentage,
      jamaahPercentage,
      completionPercentage,
      bestWeek: null, // TODO: Implement weekly breakdown
      dailyAverage,
    };
  };

  /**
   * Generate heatmap data for calendar view
   */
  const generateHeatmapData = (dailyStats: DayStats[]) => {
    return dailyStats.map(day => ({
      date: day.date,
      count: day.prayersLogged,
      level: day.completion >= 100 ? 4 : day.completion >= 80 ? 3 : day.completion >= 60 ? 2 : day.completion >= 40 ? 1 : 0,
    }));
  };

  /**
   * Fetch and calculate all statistics
   */
  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Calculate date range
      const endDate = new Date();
      const startDate = subDays(endDate, days - 1);

      // Fetch all prayer logs for the period
      const { data: logs, error: fetchError } = await supabase
        .from('prayer_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date', { ascending: false });

      if (fetchError) throw fetchError;

      // Generate all dates in the range
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      const dailyStats = dateRange.map(date =>
        calculateDailyStats(logs || [], format(date, 'yyyy-MM-dd'))
      );

      // Calculate all statistics
      const weeklyStats = calculateWeeklyStats(dailyStats);
      const monthlyStats = calculateMonthlyStats(dailyStats);
      const streak = calculateStreak(dailyStats);
      const heatmapData = generateHeatmapData(dailyStats);

      setStats({
        daily: dailyStats,
        weekly: weeklyStats,
        monthly: monthlyStats,
        streak,
        heatmapData,
      });
    } catch (err) {
      logger.error('Error fetching prayer stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refresh: fetchStats,
  };
};

export default usePrayerStats;
