/**
 * Hook for managing user settings
 * Handles fetching and updating user preferences stored in Supabase
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { UserSettings, Locale, Madhhab, AsrMethod, PrayerOffsets } from '../types';
import { setLanguage } from '../services/i18n';

import { createLogger } from '../utils/logger';

const logger = createLogger('useUserSettings');

interface UpdateSettingsParams {
  locale?: Locale;
  timezone?: string;
  madhhab?: Madhhab;
  asrMethod?: AsrMethod;
  hijriEnabled?: boolean;
  barakahPointsEnabled?: boolean;
  notificationsEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  prayerCalcMethod?: string;
  prayerOffsets?: PrayerOffsets;
}

/**
 * Fetch user settings from Supabase
 */
const fetchUserSettings = async (): Promise<UserSettings | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // If no settings found (PGRST116), return null instead of throwing
  if (error && error.code === 'PGRST116') {
    logger.debug('No settings found for user, returning null');
    return null;
  }

  if (error) {
    logger.error('Error fetching user settings:', error);
    // Don't throw - return null to allow app to continue
    return null;
  }

  if (!data) {
    return null;
  }

  // Map database fields to UserSettings interface
  return {
    userId: data.user_id,
    locale: data.locale as Locale,
    timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    madhhab: data.madhhab as Madhhab,
    asrMethod: data.asr_method as AsrMethod,
    hijriEnabled: data.hijri_enabled ?? false,
    barakahPointsEnabled: data.barakah_points_enabled ?? false,
    notificationsEnabled: data.notifications_enabled ?? true,
    quietHoursStart: data.quiet_hours_start,
    quietHoursEnd: data.quiet_hours_end,
    prayerCalcMethod: data.prayer_calc_method || 'MuslimWorldLeague',
    prayerOffsets: data.prayer_offsets as PrayerOffsets,
  };
};

/**
 * Update user settings in Supabase
 */
const updateUserSettings = async (params: UpdateSettingsParams): Promise<UserSettings> => {
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

  if (params.locale !== undefined) updateData.locale = params.locale;
  if (params.timezone !== undefined) updateData.timezone = params.timezone;
  if (params.madhhab !== undefined) updateData.madhhab = params.madhhab;
  if (params.asrMethod !== undefined) updateData.asr_method = params.asrMethod;
  if (params.hijriEnabled !== undefined) updateData.hijri_enabled = params.hijriEnabled;
  if (params.barakahPointsEnabled !== undefined)
    updateData.barakah_points_enabled = params.barakahPointsEnabled;
  if (params.notificationsEnabled !== undefined)
    updateData.notifications_enabled = params.notificationsEnabled;
  if (params.quietHoursStart !== undefined) updateData.quiet_hours_start = params.quietHoursStart;
  if (params.quietHoursEnd !== undefined) updateData.quiet_hours_end = params.quietHoursEnd;
  if (params.prayerCalcMethod !== undefined)
    updateData.prayer_calc_method = params.prayerCalcMethod;
  if (params.prayerOffsets !== undefined) updateData.prayer_offsets = params.prayerOffsets;

  const { data, error } = await supabase
    .from('settings')
    .update(updateData)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    logger.error('Error updating user settings:', error);
    throw error;
  }

  // If language changed, update i18n
  if (params.locale) {
    await setLanguage(params.locale);
  }

  return {
    userId: data.user_id,
    locale: data.locale as Locale,
    timezone: data.timezone,
    madhhab: data.madhhab as Madhhab,
    asrMethod: data.asr_method as AsrMethod,
    hijriEnabled: data.hijri_enabled,
    barakahPointsEnabled: data.barakah_points_enabled,
    notificationsEnabled: data.notifications_enabled,
    quietHoursStart: data.quiet_hours_start,
    quietHoursEnd: data.quiet_hours_end,
    prayerCalcMethod: data.prayer_calc_method,
    prayerOffsets: data.prayer_offsets as PrayerOffsets,
  };
};

/**
 * Hook to manage user settings
 */
export const useUserSettings = () => {
  const queryClient = useQueryClient();

  // Fetch settings query
  const {
    data: settings,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['userSettings'],
    queryFn: fetchUserSettings,
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

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: updateUserSettings,
    onMutate: async newSettings => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['userSettings'] });

      // Snapshot the previous value
      const previousSettings = queryClient.getQueryData<UserSettings>(['userSettings']);

      // Optimistically update to the new value
      queryClient.setQueryData<UserSettings>(['userSettings'], old => {
        if (!old) return old;
        return { ...old, ...newSettings };
      });

      // Return context with previous value
      return { previousSettings };
    },
    onError: (err, newSettings, context) => {
      // Rollback to previous value on error
      if (context?.previousSettings) {
        queryClient.setQueryData(['userSettings'], context.previousSettings);
      }
    },
    onSuccess: () => {
      // Invalidate related queries that depend on settings
      queryClient.invalidateQueries({ queryKey: ['prayerTimes'] });
      queryClient.invalidateQueries({ queryKey: ['prayers'] });
    },
    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
    },
  });

  // Helper methods for common updates
  const updateLanguage = (locale: Locale) => {
    return updateMutation.mutateAsync({ locale });
  };

  const updateTimezone = (timezone: string) => {
    return updateMutation.mutateAsync({ timezone });
  };

  const updateMadhhab = (madhhab: Madhhab) => {
    return updateMutation.mutateAsync({ madhhab });
  };

  const updatePrayerCalcMethod = (method: string) => {
    return updateMutation.mutateAsync({ prayerCalcMethod: method });
  };

  const updateNotifications = (enabled: boolean) => {
    return updateMutation.mutateAsync({ notificationsEnabled: enabled });
  };

  const updateQuietHours = (start: string, end: string) => {
    return updateMutation.mutateAsync({
      quietHoursStart: start,
      quietHoursEnd: end,
    });
  };

  const toggleHijriCalendar = (enabled: boolean) => {
    return updateMutation.mutateAsync({ hijriEnabled: enabled });
  };

  const toggleBarakahPoints = (enabled: boolean) => {
    return updateMutation.mutateAsync({ barakahPointsEnabled: enabled });
  };

  const updatePrayerOffsets = (offsets: PrayerOffsets) => {
    return updateMutation.mutateAsync({ prayerOffsets: offsets });
  };

  return {
    settings,
    isLoading,
    error,
    refetch,
    updateSettings: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
    // Helper methods
    updateLanguage,
    updateTimezone,
    updateMadhhab,
    updatePrayerCalcMethod,
    updateNotifications,
    updateQuietHours,
    toggleHijriCalendar,
    toggleBarakahPoints,
    updatePrayerOffsets,
  };
};
