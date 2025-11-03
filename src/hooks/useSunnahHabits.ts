/**
 * useSunnahHabits Hook
 * Manages Sunnah habits fetching, logging, and state
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import {
  fetchHabitsWithLogs,
  logSunnahHabit,
  updateSunnahLog,
  deleteSunnahLog,
  getDailyRecommendations,
  pinHabit as servicePinHabit,
  unpinHabit as serviceUnpinHabit,
  fetchSunnahCategories,
} from '../services/sunnahService';
import type { SunnahHabitWithLog, SunnahLevel, SunnahCategory } from '../types';

import { createLogger } from '../utils/logger';

const logger = createLogger('useSunnahHabits');

export interface UseSunnahHabitsOptions {
  date?: string; // ISO date format (YYYY-MM-DD)
  autoLoad?: boolean;
}

export interface UseSunnahHabitsReturn {
  habits: SunnahHabitWithLog[];
  categories: SunnahCategory[];
  recommendedHabits: SunnahHabitWithLog[];
  isLoading: boolean;
  error: string | null;
  logHabit: (habitId: string, level: SunnahLevel, reflection?: string) => Promise<void>;
  updateLog: (logId: string, level?: SunnahLevel, reflection?: string) => Promise<void>;
  deleteLog: (logId: string) => Promise<void>;
  pinHabit: (habitId: string) => Promise<void>;
  unpinHabit: (habitId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook to manage Sunnah habits with logging functionality
 *
 * @param options - Configuration options
 * @returns Habits data and management functions
 *
 * @example
 * const { habits, recommendedHabits, logHabit, isLoading } = useSunnahHabits({
 *   date: '2025-11-01'
 * });
 */
export function useSunnahHabits(options: UseSunnahHabitsOptions = {}): UseSunnahHabitsReturn {
  // Memoize the date string and autoLoad to prevent infinite loops
  const [dateString] = useState(() => options.date || format(new Date(), 'yyyy-MM-dd'));
  const [autoLoad] = useState(() => options.autoLoad ?? true);

  const [habits, setHabits] = useState<SunnahHabitWithLog[]>([]);
  const [categories, setCategories] = useState<SunnahCategory[]>([]);
  const [recommendedHabitIds, setRecommendedHabitIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch habits with log status - NOT using useCallback to avoid recreating
  const fetchDataRef = useRef<() => Promise<void>>(async () => {});

  fetchDataRef.current = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [habitsData, recommendedIds, categoriesData] = await Promise.all([
        fetchHabitsWithLogs(dateString),
        getDailyRecommendations(dateString),
        fetchSunnahCategories(),
      ]);

      setHabits(habitsData);
      setRecommendedHabitIds(recommendedIds);
      setCategories(categoriesData);
    } catch (err: any) {
      logger.error('Error fetching Sunnah habits:', err);
      setError(err.message || 'Failed to fetch Sunnah habits');
    } finally {
      setIsLoading(false);
    }
  };

  // Create stable wrapper function
  const fetchData = useCallback(() => {
    return fetchDataRef.current?.() ?? Promise.resolve();
  }, []);

  // Auto-load on mount - runs only once
  useEffect(() => {
    if (autoLoad) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty array - only run on mount

  // Log a habit
  const logHabit = useCallback(
    async (habitId: string, level: SunnahLevel, reflection?: string) => {
      try {
        await logSunnahHabit(habitId, level, dateString, reflection);
        await fetchData(); // Refresh to get updated data
      } catch (err: any) {
        logger.error('Error logging Sunnah habit:', err);
        throw new Error(err.message || 'Failed to log habit');
      }
    },
    [dateString, fetchData]
  );

  // Update an existing log
  const updateLog = useCallback(
    async (logId: string, level?: SunnahLevel, reflection?: string) => {
      try {
        const updates: { level?: SunnahLevel; reflection?: string } = {};
        if (level !== undefined) updates.level = level;
        if (reflection !== undefined) updates.reflection = reflection;

        await updateSunnahLog(logId, updates);
        await fetchData(); // Refresh
      } catch (err: any) {
        logger.error('Error updating Sunnah log:', err);
        throw new Error(err.message || 'Failed to update log');
      }
    },
    [fetchData]
  );

  // Delete a log
  const deleteLog = useCallback(
    async (logId: string) => {
      try {
        await deleteSunnahLog(logId);
        await fetchData(); // Refresh
      } catch (err: any) {
        logger.error('Error deleting Sunnah log:', err);
        throw new Error(err.message || 'Failed to delete log');
      }
    },
    [fetchData]
  );

  // Pin a habit
  const pinHabit = useCallback(
    async (habitId: string) => {
      try {
        await servicePinHabit(habitId);
        await fetchData(); // Refresh to update recommendations
      } catch (err: any) {
        logger.error('Error pinning habit:', err);
        throw new Error(err.message || 'Failed to pin habit');
      }
    },
    [fetchData]
  );

  // Unpin a habit
  const unpinHabit = useCallback(
    async (habitId: string) => {
      try {
        await serviceUnpinHabit(habitId);
        await fetchData(); // Refresh to update recommendations
      } catch (err: any) {
        logger.error('Error unpinning habit:', err);
        throw new Error(err.message || 'Failed to unpin habit');
      }
    },
    [fetchData]
  );

  // Get recommended habits (filter from all habits)
  const recommendedHabits = habits.filter(habit => recommendedHabitIds.includes(habit.id));

  return {
    habits,
    categories,
    recommendedHabits,
    isLoading,
    error,
    logHabit,
    updateLog,
    deleteLog,
    pinHabit,
    unpinHabit,
    refresh: fetchData,
  };
}

/**
 * Hook to get only recommended habits for today
 * Lightweight alternative when you only need today's recommendations
 */
export function useTodayRecommendations(): {
  habits: SunnahHabitWithLog[];
  isLoading: boolean;
  error: string | null;
} {
  const { recommendedHabits, isLoading, error } = useSunnahHabits();

  return {
    habits: recommendedHabits,
    isLoading,
    error,
  };
}

/**
 * Hook to get habits filtered by category
 */
export function useSunnahHabitsByCategory(categoryId: string): {
  habits: SunnahHabitWithLog[];
  isLoading: boolean;
  error: string | null;
} {
  const { habits, isLoading, error } = useSunnahHabits();

  const filteredHabits = habits.filter(habit => habit.category_id === categoryId);

  return {
    habits: filteredHabits,
    isLoading,
    error,
  };
}
