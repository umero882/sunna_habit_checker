/**
 * useSunnahStats Hook
 * Provides comprehensive Sunnah statistics including streaks, level distribution, insights
 */

import { useState, useEffect, useCallback } from 'react';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import {
  fetchLogsForDateRange,
  fetchSunnahHabits,
  fetchUserMilestones,
} from '../services/sunnahService';
import type {
  SunnahLog,
  SunnahHabit,
  SunnahHabitWithCategory,
  SunnahLevel,
  SunnahCategoryName,
  SunnahInsights,
  SunnahMilestone,
} from '../types';

import { createLogger } from '../utils/logger';

const logger = createLogger('useSunnahStats');

export interface SunnahDayStats {
  date: string;
  totalHabits: number;
  habitsLogged: number;
  basicCount: number;
  companionCount: number;
  propheticCount: number;
  completion: number; // percentage
}

export interface SunnahWeeklyStats {
  weekStart: string;
  weekEnd: string;
  totalPossible: number; // totalHabits * 7 days
  habitsLogged: number;
  completionPercentage: number;
  levelDistribution: {
    basic: number;
    companion: number;
    prophetic: number;
  };
  topHabits: Array<{ habitId: string; count: number }>;
}

export interface SunnahMonthlyStats {
  monthStart: string;
  monthEnd: string;
  totalPossible: number;
  habitsLogged: number;
  completionPercentage: number;
  averagePerDay: number;
  favoriteCategory: SunnahCategoryName | null;
}

export interface SunnahStreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastLoggedDate: string | null;
}

export interface SunnahStatsData {
  daily: SunnahDayStats[];
  weekly: SunnahWeeklyStats;
  monthly: SunnahMonthlyStats;
  streak: SunnahStreakInfo;
  insights: SunnahInsights;
  heatmapData: { date: string; count: number; level: number }[]; // For calendar view
  milestones: SunnahMilestone[];
}

interface UseSunnahStatsOptions {
  days?: number; // Number of days to fetch (default: 30)
}

export const useSunnahStats = (options: UseSunnahStatsOptions = {}) => {
  // Memoize days to prevent fetchStats from changing on every render
  const [days] = useState(() => options.days ?? 30);

  const [stats, setStats] = useState<SunnahStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Calculate daily stats from logs
   */
  const calculateDailyStats = (
    logs: SunnahLog[],
    habits: SunnahHabitWithCategory[],
    date: string
  ): SunnahDayStats => {
    const dayLogs = logs.filter(log => log.date === date);
    const totalHabits = habits.length;
    const habitsLogged = dayLogs.length;
    const basicCount = dayLogs.filter(log => log.level === 'basic').length;
    const companionCount = dayLogs.filter(log => log.level === 'companion').length;
    const propheticCount = dayLogs.filter(log => log.level === 'prophetic').length;
    const completion = totalHabits > 0 ? Math.round((habitsLogged / totalHabits) * 100) : 0;

    return {
      date,
      totalHabits,
      habitsLogged,
      basicCount,
      companionCount,
      propheticCount,
      completion,
    };
  };

  /**
   * Calculate streak information
   * A streak is maintained if user logs at least one habit per day
   */
  const calculateStreak = (dailyStats: SunnahDayStats[]): SunnahStreakInfo => {
    if (dailyStats.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastLoggedDate: null,
      };
    }

    // Sort by date descending
    const sorted = [...dailyStats].sort((a, b) => b.date.localeCompare(a.date));

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastLoggedDate: string | null = null;

    // Find last logged date
    for (const day of sorted) {
      if (day.habitsLogged > 0) {
        lastLoggedDate = day.date;
        break;
      }
    }

    // Calculate current streak (from today backwards)
    for (const day of sorted) {
      if (day.habitsLogged > 0) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak
    for (const day of sorted) {
      if (day.habitsLogged > 0) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    return {
      currentStreak,
      longestStreak,
      lastLoggedDate,
    };
  };

  /**
   * Calculate weekly stats
   */
  const calculateWeeklyStats = (
    logs: SunnahLog[],
    habits: SunnahHabitWithCategory[],
    startDate: Date,
    endDate: Date
  ): SunnahWeeklyStats => {
    const weekLogs = logs.filter(
      log =>
        log.date >= format(startDate, 'yyyy-MM-dd') && log.date <= format(endDate, 'yyyy-MM-dd')
    );

    const daysInWeek = 7;
    const totalPossible = habits.length * daysInWeek;
    const habitsLogged = weekLogs.length;
    const completionPercentage =
      totalPossible > 0 ? Math.round((habitsLogged / totalPossible) * 100) : 0;

    // Level distribution
    const basicCount = weekLogs.filter(log => log.level === 'basic').length;
    const companionCount = weekLogs.filter(log => log.level === 'companion').length;
    const propheticCount = weekLogs.filter(log => log.level === 'prophetic').length;

    // Top habits
    const habitCounts: Record<string, number> = {};
    weekLogs.forEach(log => {
      habitCounts[log.habit_id] = (habitCounts[log.habit_id] || 0) + 1;
    });
    const topHabits = Object.entries(habitCounts)
      .map(([habitId, count]) => ({ habitId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      weekStart: format(startDate, 'yyyy-MM-dd'),
      weekEnd: format(endDate, 'yyyy-MM-dd'),
      totalPossible,
      habitsLogged,
      completionPercentage,
      levelDistribution: {
        basic: basicCount,
        companion: companionCount,
        prophetic: propheticCount,
      },
      topHabits,
    };
  };

  /**
   * Calculate monthly stats
   */
  const calculateMonthlyStats = (
    logs: SunnahLog[],
    habits: SunnahHabitWithCategory[],
    daysInMonth: number
  ): SunnahMonthlyStats => {
    const today = new Date();
    const monthStart = format(new Date(today.getFullYear(), today.getMonth(), 1), 'yyyy-MM-dd');
    const monthEnd = format(new Date(today.getFullYear(), today.getMonth() + 1, 0), 'yyyy-MM-dd');

    const totalPossible = habits.length * daysInMonth;
    const habitsLogged = logs.length;
    const completionPercentage =
      totalPossible > 0 ? Math.round((habitsLogged / totalPossible) * 100) : 0;
    const averagePerDay = daysInMonth > 0 ? Math.round((habitsLogged / daysInMonth) * 10) / 10 : 0;

    // Find favorite category
    const categoryCounts: Record<string, number> = {};
    logs.forEach(log => {
      const habit = habits.find(h => h.id === log.habit_id);
      if (habit) {
        const categoryName = habit.category?.name || 'Unknown';
        categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
      }
    });

    const favoriteCategory =
      Object.keys(categoryCounts).length > 0
        ? (Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0][0] as SunnahCategoryName)
        : null;

    return {
      monthStart,
      monthEnd,
      totalPossible,
      habitsLogged,
      completionPercentage,
      averagePerDay,
      favoriteCategory,
    };
  };

  /**
   * Calculate insights
   */
  const calculateInsights = (
    logs: SunnahLog[],
    habits: SunnahHabitWithCategory[],
    weeklyStats: SunnahWeeklyStats,
    milestones: SunnahMilestone[]
  ): SunnahInsights => {
    // Level distribution
    const basicCount = logs.filter(log => log.level === 'basic').length;
    const companionCount = logs.filter(log => log.level === 'companion').length;
    const propheticCount = logs.filter(log => log.level === 'prophetic').length;

    // Top habits
    const habitCounts: Record<string, { count: number; levels: SunnahLevel[] }> = {};
    logs.forEach(log => {
      if (!habitCounts[log.habit_id]) {
        habitCounts[log.habit_id] = { count: 0, levels: [] };
      }
      habitCounts[log.habit_id].count++;
      habitCounts[log.habit_id].levels.push(log.level);
    });

    const topHabits = Object.entries(habitCounts)
      .map(([habitId, data]) => {
        const habit = habits.find(h => h.id === habitId);
        if (!habit) return null;

        // Get most recent level
        const currentLevel = data.levels[data.levels.length - 1];

        return {
          habit,
          completionCount: data.count,
          currentLevel,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.completionCount - a.completionCount)
      .slice(0, 5);

    // Calculate overall streak (based on daily logs)
    const uniqueDates = [...new Set(logs.map(log => log.date))].sort().reverse();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

    // Current streak
    if (uniqueDates.length > 0 && (uniqueDates[0] === today || uniqueDates[0] === yesterday)) {
      for (let i = 0; i < uniqueDates.length; i++) {
        const expectedDate = format(subDays(new Date(), i), 'yyyy-MM-dd');
        if (uniqueDates[i] === expectedDate) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Longest streak
    for (let i = 0; i < uniqueDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const currentDate = new Date(uniqueDates[i]);
        const prevDate = new Date(uniqueDates[i - 1]);
        const diffDays = Math.round(
          (prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Recent milestones
    const recentMilestones = [...milestones]
      .sort((a, b) => new Date(b.achieved_at).getTime() - new Date(a.achieved_at).getTime())
      .slice(0, 5);

    return {
      weeklyCompletion: weeklyStats.completionPercentage,
      favoriteCategory: null, // Will be calculated from all logs
      currentStreak,
      longestStreak,
      totalMilestones: milestones.length,
      recentMilestones,
      levelDistribution: {
        basic: basicCount,
        companion: companionCount,
        prophetic: propheticCount,
      },
      topHabits,
    };
  };

  /**
   * Generate heatmap data for calendar view
   */
  const generateHeatmapData = (
    dailyStats: SunnahDayStats[]
  ): { date: string; count: number; level: number }[] => {
    return dailyStats.map(day => {
      const level =
        day.completion >= 75
          ? 4
          : day.completion >= 50
            ? 3
            : day.completion >= 25
              ? 2
              : day.completion > 0
                ? 1
                : 0;

      return {
        date: day.date,
        count: day.habitsLogged,
        level,
      };
    });
  };

  /**
   * Fetch and calculate all stats
   */
  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const endDate = new Date();
      const startDate = subDays(endDate, days - 1);

      // Fetch all data in parallel
      const [logs, habits, milestones] = await Promise.all([
        fetchLogsForDateRange(format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd')),
        fetchSunnahHabits(),
        fetchUserMilestones(),
      ]);

      // Generate array of all dates in range
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      const dates = dateRange.map(d => format(d, 'yyyy-MM-dd'));

      // Calculate daily stats for each date
      const daily = dates.map(date => calculateDailyStats(logs, habits, date));

      // Calculate streak
      const streak = calculateStreak(daily);

      // Calculate weekly stats (current week)
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });
      const weekly = calculateWeeklyStats(logs, habits, weekStart, weekEnd);

      // Calculate monthly stats
      const monthly = calculateMonthlyStats(logs, habits, days);

      // Calculate insights
      const insights = calculateInsights(logs, habits, weekly, milestones);

      // Generate heatmap data
      const heatmapData = generateHeatmapData(daily);

      setStats({
        daily,
        weekly,
        monthly,
        streak,
        insights,
        heatmapData,
        milestones,
      });
    } catch (err: any) {
      logger.error('Error fetching Sunnah stats:', err);
      setError(err.message || 'Failed to fetch Sunnah statistics');
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  // Auto-fetch on mount
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

/**
 * Hook to get only today's completion percentage
 */
export const useTodaySunnahCompletion = (): number => {
  const { stats } = useSunnahStats({ days: 1 });

  if (!stats || stats.daily.length === 0) return 0;

  return stats.daily[0]?.completion || 0;
};
