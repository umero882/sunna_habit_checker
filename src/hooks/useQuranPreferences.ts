/**
 * Hook for managing Quran user preferences
 * Handles fetching and updating Quran-specific preferences stored in Supabase
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { createLogger } from '../utils/logger';

const logger = createLogger('useQuranPreferences');

export interface QuranPreferences {
  userId: string;
  translation: string;
  showTransliteration: boolean;
  fontSize: number;
  theme: string;
  reciter: string;
  playbackSpeed: number;
  autoScroll: boolean;
  dailyGoalMode: 'pages' | 'ayahs' | 'time';
  dailyGoalValue: number;
  lastSurah?: number;
  lastAyah?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface UpdateQuranPreferencesParams {
  translation?: string;
  showTransliteration?: boolean;
  fontSize?: number;
  theme?: string;
  reciter?: string;
  playbackSpeed?: number;
  autoScroll?: boolean;
  dailyGoalMode?: 'pages' | 'ayahs' | 'time';
  dailyGoalValue?: number;
  lastSurah?: number;
  lastAyah?: number;
}

/**
 * Fetch user Quran preferences from Supabase
 */
const fetchQuranPreferences = async (): Promise<QuranPreferences | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('user_quran_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // If no preferences found (PGRST116), return null instead of throwing
  if (error && error.code === 'PGRST116') {
    logger.debug('No Quran preferences found for user, returning null');
    return null;
  }

  if (error) {
    logger.error('Error fetching Quran preferences:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  // Map database fields to QuranPreferences interface
  return {
    userId: data.user_id,
    translation: data.translation || 'en.sahih',
    showTransliteration: data.show_transliteration ?? false,
    fontSize: data.font_size || 18,
    theme: data.theme || 'light',
    reciter: data.reciter || 'ar.alafasy',
    playbackSpeed: data.playback_speed || 1.0,
    autoScroll: data.auto_scroll ?? true,
    dailyGoalMode: (data.daily_goal_mode as 'pages' | 'ayahs' | 'time') || 'pages',
    dailyGoalValue: data.daily_goal_value || 2,
    lastSurah: data.last_surah,
    lastAyah: data.last_ayah,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

/**
 * Update user Quran preferences in Supabase
 */
const updateQuranPreferences = async (
  params: UpdateQuranPreferencesParams
): Promise<QuranPreferences> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Map interface fields to database columns
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (params.translation !== undefined) updateData.translation = params.translation;
  if (params.showTransliteration !== undefined)
    updateData.show_transliteration = params.showTransliteration;
  if (params.fontSize !== undefined) updateData.font_size = params.fontSize;
  if (params.theme !== undefined) updateData.theme = params.theme;
  if (params.reciter !== undefined) updateData.reciter = params.reciter;
  if (params.playbackSpeed !== undefined) updateData.playback_speed = params.playbackSpeed;
  if (params.autoScroll !== undefined) updateData.auto_scroll = params.autoScroll;
  if (params.dailyGoalMode !== undefined) updateData.daily_goal_mode = params.dailyGoalMode;
  if (params.dailyGoalValue !== undefined) updateData.daily_goal_value = params.dailyGoalValue;
  if (params.lastSurah !== undefined) updateData.last_surah = params.lastSurah;
  if (params.lastAyah !== undefined) updateData.last_ayah = params.lastAyah;

  // Use upsert to create if doesn't exist or update if exists
  const { data, error } = await supabase
    .from('user_quran_preferences')
    .upsert(
      {
        user_id: user.id,
        ...updateData,
      },
      {
        onConflict: 'user_id',
        ignoreDuplicates: false,
      }
    )
    .select()
    .single();

  if (error) {
    logger.error('Error updating Quran preferences:', error);
    throw error;
  }

  // Also sync reciter to AsyncStorage for backward compatibility
  if (params.reciter) {
    try {
      await AsyncStorage.setItem('@quran:preferred_reciter', params.reciter);
    } catch (asyncError) {
      logger.warn('Failed to sync reciter to AsyncStorage:', asyncError);
    }
  }

  return {
    userId: data.user_id,
    translation: data.translation,
    showTransliteration: data.show_transliteration,
    fontSize: data.font_size,
    theme: data.theme,
    reciter: data.reciter,
    playbackSpeed: data.playback_speed,
    autoScroll: data.auto_scroll,
    dailyGoalMode: data.daily_goal_mode,
    dailyGoalValue: data.daily_goal_value,
    lastSurah: data.last_surah,
    lastAyah: data.last_ayah,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

/**
 * Hook to manage Quran preferences
 */
export const useQuranPreferences = () => {
  const queryClient = useQueryClient();

  // Fetch preferences query
  const {
    data: preferences,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['quranPreferences'],
    queryFn: fetchQuranPreferences,
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

  // Update preferences mutation
  const updateMutation = useMutation({
    mutationFn: updateQuranPreferences,
    onMutate: async newPreferences => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['quranPreferences'] });

      // Snapshot the previous value
      const previousPreferences = queryClient.getQueryData<QuranPreferences>(['quranPreferences']);

      // Optimistically update to the new value
      queryClient.setQueryData<QuranPreferences>(['quranPreferences'], old => {
        if (!old) return old;
        return { ...old, ...newPreferences };
      });

      // Return context with previous value
      return { previousPreferences };
    },
    onError: (err, newPreferences, context) => {
      // Rollback to previous value on error
      if (context?.previousPreferences) {
        queryClient.setQueryData(['quranPreferences'], context.previousPreferences);
      }
    },
    onSuccess: () => {
      // Invalidate related queries that depend on preferences
      queryClient.invalidateQueries({ queryKey: ['quranProgress'] });
      queryClient.invalidateQueries({ queryKey: ['readingPlans'] });
    },
    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['quranPreferences'] });
    },
  });

  // Helper methods for common updates
  const updateReciter = (reciter: string) => {
    return updateMutation.mutateAsync({ reciter });
  };

  const updateDailyGoal = (mode: 'pages' | 'ayahs' | 'time', value: number) => {
    return updateMutation.mutateAsync({
      dailyGoalMode: mode,
      dailyGoalValue: value,
    });
  };

  const updateReadingPosition = (surah: number, ayah: number) => {
    return updateMutation.mutateAsync({
      lastSurah: surah,
      lastAyah: ayah,
    });
  };

  const updateTranslation = (translation: string) => {
    return updateMutation.mutateAsync({ translation });
  };

  const updateFontSize = (fontSize: number) => {
    return updateMutation.mutateAsync({ fontSize });
  };

  const updateTheme = (theme: string) => {
    return updateMutation.mutateAsync({ theme });
  };

  return {
    preferences,
    isLoading,
    error,
    refetch,
    updatePreferences: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
    // Helper methods
    updateReciter,
    updateDailyGoal,
    updateReadingPosition,
    updateTranslation,
    updateFontSize,
    updateTheme,
  };
};
