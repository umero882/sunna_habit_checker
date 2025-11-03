/**
 * Hook for managing weekly progress snapshots
 * Used for analytics charts and trend visualization
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { startOfWeek, subWeeks, format } from 'date-fns';

import { createLogger } from '../utils/logger';

const logger = createLogger('useProgressSnapshots');

export interface ProgressSnapshot {
  id: string;
  userId: string;
  weekStart: string;
  prayersOnTime: number;
  quranMinutes: number;
  sunnahCompleted: number;
  charityEntries: number;
  levelDistribution: {
    basic: number;
    companion: number;
    prophetic: number;
  };
  reflectionCount: number;
  createdAt: string;
}

interface WeeklyTrendData {
  week: string; // Display label (e.g., "Jan 1")
  prayers: number;
  quran: number;
  sunnah: number;
  charity: number;
}

/**
 * Fetch progress snapshots for the last N weeks
 */
const fetchProgressSnapshots = async (weeksCount: number = 8): Promise<ProgressSnapshot[]> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Calculate the date range
  const endDate = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
  const startDate = subWeeks(endDate, weeksCount - 1);

  const { data, error } = await supabase
    .from('user_progress_snapshots')
    .select('*')
    .eq('user_id', user.id)
    .gte('week_start', format(startDate, 'yyyy-MM-dd'))
    .lte('week_start', format(endDate, 'yyyy-MM-dd'))
    .order('week_start', { ascending: true });

  if (error) {
    logger.error('Error fetching progress snapshots:', error);
    // If table doesn't exist yet (migration not applied), return empty array
    if (error.code === '42P01') {
      logger.debug('Progress snapshots table does not exist yet - returning empty data');
      return [];
    }
    // Don't throw - return empty array to allow app to continue
    return [];
  }

  return (data || []).map((snapshot) => ({
    id: snapshot.id,
    userId: snapshot.user_id,
    weekStart: snapshot.week_start,
    prayersOnTime: snapshot.prayers_on_time || 0,
    quranMinutes: snapshot.quran_minutes || 0,
    sunnahCompleted: snapshot.sunnah_completed || 0,
    charityEntries: snapshot.charity_entries || 0,
    levelDistribution: snapshot.level_distribution || { basic: 0, companion: 0, prophetic: 0 },
    reflectionCount: snapshot.reflection_count || 0,
    createdAt: snapshot.created_at,
  }));
};

/**
 * Generate a snapshot for a specific week using database function
 */
const generateSnapshot = async (weekStart: Date): Promise<ProgressSnapshot> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const weekStartStr = format(weekStart, 'yyyy-MM-dd');

  const { data, error } = await supabase.rpc('generate_week_snapshot', {
    p_user_id: user.id,
    p_week_start: weekStartStr,
  });

  if (error) {
    logger.error('Error generating snapshot:', error);
    throw error;
  }

  return {
    id: data.id,
    userId: data.user_id,
    weekStart: data.week_start,
    prayersOnTime: data.prayers_on_time || 0,
    quranMinutes: data.quran_minutes || 0,
    sunnahCompleted: data.sunnah_completed || 0,
    charityEntries: data.charity_entries || 0,
    levelDistribution: data.level_distribution || { basic: 0, companion: 0, prophetic: 0 },
    reflectionCount: data.reflection_count || 0,
    createdAt: data.created_at,
  };
};

/**
 * Transform snapshots into chart-friendly weekly trend data
 */
const transformToWeeklyTrend = (snapshots: ProgressSnapshot[]): WeeklyTrendData[] => {
  return snapshots.map((snapshot) => ({
    week: format(new Date(snapshot.weekStart), 'MMM d'),
    prayers: snapshot.prayersOnTime,
    quran: Math.round(snapshot.quranMinutes / 60), // Convert to hours for better chart scale
    sunnah: snapshot.sunnahCompleted,
    charity: snapshot.charityEntries,
  }));
};

/**
 * Hook to manage progress snapshots
 */
export const useProgressSnapshots = (weeksCount: number = 8) => {
  const queryClient = useQueryClient();

  // Fetch snapshots query
  const {
    data: snapshots,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['progressSnapshots', weeksCount],
    queryFn: () => fetchProgressSnapshots(weeksCount),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (error?.message?.includes('not authenticated')) {
        return false;
      }
      // Don't retry if table doesn't exist
      if (error?.code === '42P01') {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Generate snapshot mutation
  const generateMutation = useMutation({
    mutationFn: generateSnapshot,
    onSuccess: () => {
      // Invalidate and refetch snapshots
      queryClient.invalidateQueries({ queryKey: ['progressSnapshots'] });
    },
  });

  // Transform data for charts
  const weeklyTrend = snapshots ? transformToWeeklyTrend(snapshots) : [];

  // Calculate aggregate stats from snapshots
  const aggregateStats = snapshots
    ? {
        totalPrayersOnTime: snapshots.reduce((sum, s) => sum + s.prayersOnTime, 0),
        totalQuranMinutes: snapshots.reduce((sum, s) => sum + s.quranMinutes, 0),
        totalSunnahCompleted: snapshots.reduce((sum, s) => sum + s.sunnahCompleted, 0),
        totalCharityEntries: snapshots.reduce((sum, s) => sum + s.charityEntries, 0),
        avgPrayersPerWeek:
          snapshots.length > 0
            ? Math.round(
                snapshots.reduce((sum, s) => sum + s.prayersOnTime, 0) / snapshots.length
              )
            : 0,
        avgQuranMinutesPerWeek:
          snapshots.length > 0
            ? Math.round(
                snapshots.reduce((sum, s) => sum + s.quranMinutes, 0) / snapshots.length
              )
            : 0,
      }
    : null;

  // Get latest level distribution for pie chart
  const latestLevelDistribution =
    snapshots && snapshots.length > 0
      ? snapshots[snapshots.length - 1].levelDistribution
      : { basic: 0, companion: 0, prophetic: 0 };

  return {
    snapshots,
    weeklyTrend,
    aggregateStats,
    latestLevelDistribution,
    isLoading,
    error,
    refetch,
    generateSnapshot: generateMutation.mutateAsync,
    isGenerating: generateMutation.isPending,
  };
};

/**
 * Hook to automatically generate current week snapshot
 * Can be called when user visits profile screen
 */
export const useGenerateCurrentWeekSnapshot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      return generateSnapshot(currentWeekStart);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progressSnapshots'] });
    },
  });
};
