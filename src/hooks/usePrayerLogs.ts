/**
 * usePrayerLogs Hook
 * React hook for managing prayer logs (tracking completed prayers)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, getCurrentUser } from '../services/supabase';
import type { PrayerLog, PrayerName, PrayerStatus } from '../types';
import { format, subDays } from 'date-fns';
import { sendStreakCelebration, type StreakMilestone } from '../services/notificationScheduler';

import { createLogger } from '../utils/logger';

const logger = createLogger('usePrayerLogs');

// Milestone days for celebrations
const STREAK_MILESTONES = [3, 7, 14, 21, 30, 40, 50, 100, 365];

/**
 * Check if user achieved a streak milestone and send celebration
 */
const checkAndCelebrateStreak = async (
  userId: string,
  prayer: PrayerName,
  currentDate: string
): Promise<void> => {
  try {
    // Calculate consecutive days of on-time prayers
    let streakDays = 0;
    let checkDate = currentDate;

    // Check backwards from current date
    for (let i = 0; i < 365; i++) {
      const { data, error } = await supabase
        .from('prayer_logs')
        .select('status')
        .eq('user_id', userId)
        .eq('prayer', prayer)
        .eq('date', checkDate)
        .single();

      if (error || !data || data.status !== 'on_time') {
        break; // Streak broken
      }

      streakDays++;
      checkDate = format(subDays(new Date(checkDate), 1), 'yyyy-MM-dd');
    }

    // Check if this is a milestone
    if (STREAK_MILESTONES.includes(streakDays)) {
      logger.debug(`🎉 Streak milestone achieved: ${prayer} - ${streakDays} days!`);

      const milestone: StreakMilestone = {
        type: 'prayer',
        name: prayer.charAt(0).toUpperCase() + prayer.slice(1),
        streakDays,
      };

      await sendStreakCelebration(milestone);
    }
  } catch (error) {
    logger.error('Error checking streak:', error);
    // Don't throw - this is a nice-to-have feature
  }
};

interface UsePrayerLogsState {
  logs: PrayerLog[];
  isLoading: boolean;
  error: string | null;
  isSyncing: boolean;
}

interface UsePrayerLogsReturn extends UsePrayerLogsState {
  logPrayer: (
    prayer: PrayerName,
    status: PrayerStatus,
    jamaah?: boolean,
    notes?: string,
    fridaySunnah?: string[]
  ) => Promise<void>;
  updatePrayerLog: (logId: string, updates: Partial<PrayerLog>) => Promise<void>;
  deletePrayerLog: (logId: string) => Promise<void>;
  getLogForPrayer: (prayer: PrayerName, date?: string) => PrayerLog | undefined;
  getTodayLogs: () => PrayerLog[];
  refreshLogs: () => Promise<void>;
}

interface UsePrayerLogsOptions {
  date?: string; // Format: 'yyyy-MM-dd', defaults to today
  autoRefresh?: boolean;
}

/**
 * Custom hook for managing prayer logs
 * Handles CRUD operations for prayer tracking
 *
 * @example
 * const { logs, logPrayer, isLoading } = usePrayerLogs({ date: '2025-10-31' });
 *
 * // Log a prayer as completed on time
 * await logPrayer('fajr', 'onTime');
 *
 * // Log a prayer as delayed with notes
 * await logPrayer('dhuhr', 'delayed', 'Traffic delay');
 */
export const usePrayerLogs = (options: UsePrayerLogsOptions = {}): UsePrayerLogsReturn => {
  // Memoize date to prevent infinite loops - calculate once and never change
  const [date] = useState(() => options.date || format(new Date(), 'yyyy-MM-dd'));
  const { autoRefresh = true } = options;

  const [state, setState] = useState<UsePrayerLogsState>({
    logs: [],
    isLoading: true,
    error: null,
    isSyncing: false,
  });

  /**
   * Fetch prayer logs for the specified date - using ref pattern to avoid infinite loops
   */
  const fetchLogsRef = useRef<() => Promise<void>>(async () => {});

  fetchLogsRef.current = async () => {
    logger.debug('=== fetchLogs called ===');
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const user = await getCurrentUser();
      if (!user) {
        setState(prev => ({
          ...prev,
          logs: [],
          isLoading: false,
          error: 'User not authenticated',
        }));
        return;
      }

      const { data, error } = await supabase
        .from('prayer_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      logger.debug('=== fetchLogs data received ===', data);
      setState(prev => ({
        ...prev,
        logs: data || [],
        isLoading: false,
        error: null,
      }));
      logger.debug('=== fetchLogs state updated ===');
    } catch (error: any) {
      logger.error('Error fetching prayer logs:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to fetch prayer logs',
        isLoading: false,
      }));
    }
  };

  // Create stable wrapper function
  const fetchLogs = useCallback(() => {
    return fetchLogsRef.current?.() ?? Promise.resolve();
  }, []);

  // Fetch logs on mount - runs only once
  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty array - only run on mount

  // Set up real-time subscription for auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    let subscription: any = null;

    const setupSubscription = async () => {
      const user = await getCurrentUser();
      if (!user) return;

      subscription = supabase
        .channel('prayer_logs_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'prayer_logs',
            filter: `user_id=eq.${user.id}`,
          },
          payload => {
            logger.debug('Prayer log changed:', payload);
            // Use ref to avoid dependency on fetchLogs
            fetchLogsRef.current();
          }
        )
        .subscribe();
    };

    setupSubscription();

    // Cleanup function
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [autoRefresh]); // Removed fetchLogs from dependencies

  /**
   * Log a prayer with status
   */
  const logPrayer = useCallback(
    async (
      prayer: PrayerName,
      status: PrayerStatus,
      jamaah?: boolean,
      notes?: string,
      fridaySunnah?: string[]
    ): Promise<void> => {
      setState(prev => ({ ...prev, isSyncing: true, error: null }));

      try {
        const user = await getCurrentUser();
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Check database directly for existing log (more reliable than state)
        const { data: existingLogs, error: checkError } = await supabase
          .from('prayer_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', date)
          .eq('prayer', prayer);

        if (checkError) throw checkError;

        const upsertData: any = {
          user_id: user.id,
          date,
          prayer,
          status,
          note: notes,
          updated_at: new Date().toISOString(),
        };

        // Handle jamaah field based on prayer status
        // Jamaah only applies to 'on_time' prayers
        if (status === 'on_time') {
          // For on_time prayers, use provided jamaah value or preserve existing
          if (jamaah !== undefined) {
            upsertData.jamaah = jamaah;
          } else if (existingLogs && existingLogs.length > 0) {
            // Preserve existing jamaah value if not provided
            upsertData.jamaah = existingLogs[0].jamaah;
          } else {
            // Default to false (alone) if not specified
            upsertData.jamaah = false;
          }
        } else {
          // For delayed/missed/qadaa prayers, jamaah is not applicable
          upsertData.jamaah = null;
        }

        // Add Friday Sunnah data if provided
        if (fridaySunnah) {
          upsertData.friday_sunnah_completed = fridaySunnah;
        }

        // Set logged_at only for new entries
        if (!existingLogs || existingLogs.length === 0) {
          upsertData.logged_at = new Date().toISOString();
        }

        // Debug logging
        logger.debug('=== usePrayerLogs UPSERT DEBUG ===');
        logger.debug('Existing logs found:', existingLogs?.length || 0);
        logger.debug('Prayer:', prayer);
        logger.debug('Status:', status);
        logger.debug('Jamaah:', upsertData.jamaah);

        // If multiple duplicates exist, delete them first
        if (existingLogs && existingLogs.length > 1) {
          logger.debug('⚠️ Multiple duplicates found! Cleaning up...');
          // Keep the most recent one, delete others
          const sortedLogs = existingLogs.sort(
            (a, b) =>
              new Date(b.updated_at || b.created_at || 0).getTime() -
              new Date(a.updated_at || a.created_at || 0).getTime()
          );
          const logsToDelete = sortedLogs.slice(1); // All except the first (most recent)

          for (const log of logsToDelete) {
            await supabase.from('prayer_logs').delete().eq('id', log.id);
          }
        }

        // Use upsert with unique constraint on (user_id, date, prayer)
        // This ensures we never have duplicates
        const { error: upsertError } = await supabase.from('prayer_logs').upsert(upsertData, {
          onConflict: 'user_id,date,prayer',
          ignoreDuplicates: false, // Update existing records
        });

        if (upsertError) throw upsertError;

        logger.debug('=== Upsert successful, calling fetchLogs ===');
        // Refresh logs
        await fetchLogs();
        logger.debug('=== fetchLogs completed ===');

        // Check for streak milestone if logged as on_time (don't block on this)
        if (status === 'on_time') {
          checkAndCelebrateStreak(user.id, prayer, date).catch(err =>
            logger.error('Failed to check streak:', err)
          );
        }

        setState(prev => ({ ...prev, isSyncing: false }));
      } catch (error: any) {
        logger.error('Error logging prayer:', error);
        setState(prev => ({
          ...prev,
          error: error.message || 'Failed to log prayer',
          isSyncing: false,
        }));
        throw error;
      }
    },
    [date, fetchLogs]
  );

  /**
   * Update an existing prayer log
   */
  const updatePrayerLog = useCallback(
    async (logId: string, updates: Partial<PrayerLog>): Promise<void> => {
      setState(prev => ({ ...prev, isSyncing: true, error: null }));

      try {
        const { error } = await supabase
          .from('prayer_logs')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', logId);

        if (error) throw error;

        // Refresh logs
        await fetchLogs();

        setState(prev => ({ ...prev, isSyncing: false }));
      } catch (error: any) {
        logger.error('Error updating prayer log:', error);
        setState(prev => ({
          ...prev,
          error: error.message || 'Failed to update prayer log',
          isSyncing: false,
        }));
        throw error;
      }
    },
    [fetchLogs]
  );

  /**
   * Delete a prayer log
   */
  const deletePrayerLog = useCallback(
    async (logId: string): Promise<void> => {
      setState(prev => ({ ...prev, isSyncing: true, error: null }));

      try {
        const { error } = await supabase.from('prayer_logs').delete().eq('id', logId);

        if (error) throw error;

        // Refresh logs
        await fetchLogs();

        setState(prev => ({ ...prev, isSyncing: false }));
      } catch (error: any) {
        logger.error('Error deleting prayer log:', error);
        setState(prev => ({
          ...prev,
          error: error.message || 'Failed to delete prayer log',
          isSyncing: false,
        }));
        throw error;
      }
    },
    [fetchLogs]
  );

  /**
   * Get log for a specific prayer on a specific date
   */
  const getLogForPrayer = useCallback(
    (prayer: PrayerName, logDate?: string): PrayerLog | undefined => {
      const targetDate = logDate || date;
      return state.logs.find(log => log.prayer === prayer && log.date === targetDate);
    },
    [state.logs, date]
  );

  /**
   * Get all logs for today
   */
  const getTodayLogs = useCallback((): PrayerLog[] => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return state.logs.filter(log => log.date === today);
  }, [state.logs]);

  /**
   * Manually refresh logs
   */
  const refreshLogs = useCallback(async (): Promise<void> => {
    await fetchLogs();
  }, [fetchLogs]);

  return {
    ...state,
    logPrayer,
    updatePrayerLog,
    deletePrayerLog,
    getLogForPrayer,
    getTodayLogs,
    refreshLogs,
  };
};

/**
 * Hook to get prayer completion statistics
 */
export const usePrayerStats = (startDate?: string, endDate?: string) => {
  const [stats, setStats] = useState({
    total: 0,
    onTime: 0,
    delayed: 0,
    missed: 0,
    qadaa: 0,
    completionRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);

      try {
        const user = await getCurrentUser();
        if (!user) return;

        let query = supabase.from('prayer_logs').select('status').eq('user_id', user.id);

        if (startDate) {
          query = query.gte('date', startDate);
        }
        if (endDate) {
          query = query.lte('date', endDate);
        }

        const { data, error } = await query;

        if (error) throw error;

        const total = data?.length || 0;
        const onTime = data?.filter(log => log.status === 'onTime').length || 0;
        const delayed = data?.filter(log => log.status === 'delayed').length || 0;
        const missed = data?.filter(log => log.status === 'missed').length || 0;
        const qadaa = data?.filter(log => log.status === 'qadaa').length || 0;
        const completionRate = total > 0 ? ((onTime + delayed) / total) * 100 : 0;

        setStats({
          total,
          onTime,
          delayed,
          missed,
          qadaa,
          completionRate,
        });
      } catch (error) {
        logger.error('Error fetching prayer stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [startDate, endDate]);

  return { stats, isLoading };
};
