/**
 * Hook for managing user profile data
 * Aggregates user information and overall statistics
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { User } from '../types';
import { usePrayerStats } from './usePrayerStats';
import { useSunnahStats } from './useSunnahStats';
import { useQuranProgress } from './useQuranProgress';
import { createLogger } from '../utils/logger';

const logger = createLogger('useProfile');

interface UserProfile extends User {
  lastSignInAt?: string;
  metadata?: {
    name?: string;
    avatar_url?: string;
  };
}

interface ProfileStats {
  prayers: {
    totalLogged: number;
    onTimeCount: number;
    currentStreak: number;
    longestStreak: number;
  };
  quran: {
    totalMinutes: number;
    totalPages: number;
    currentStreak: number;
    plansCompleted: number;
  };
  sunnah: {
    totalCompleted: number;
    currentStreak: number;
    categoriesActive: number;
    milestonesEarned: number;
  };
  charity: {
    totalEntries: number;
  };
  reflections: {
    totalEntries: number;
  };
  overall: {
    daysActive: number;
    joinedDate: string;
  };
}

/**
 * Fetch user profile data from Supabase Auth and user_profiles table
 */
const fetchUserProfile = async (): Promise<UserProfile> => {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('User not authenticated');
  }

  // Fetch avatar_url from user_profiles table
  const { data: profileData, error: profileError } = await supabase
    .from('user_profiles')
    .select('avatar_url, full_name')
    .eq('user_id', user.id)
    .single();

  if (profileError) {
    logger.warn('Error fetching profile data:', profileError);
  }

  logger.info('Profile data fetched:', {
    userId: user.id,
    hasProfile: !!profileData,
    avatarUrl: profileData?.avatar_url || 'none',
    fullName: profileData?.full_name || 'none',
  });

  return {
    id: user.id,
    email: user.email,
    createdAt: user.created_at || new Date().toISOString(),
    lastSignInAt: user.last_sign_in_at,
    metadata: {
      name: profileData?.full_name || user.user_metadata?.name,
      avatar_url: profileData?.avatar_url,
    },
  };
};

/**
 * Get user initials from email or name
 */
const getUserInitials = (profile: UserProfile | undefined): string => {
  if (!profile) return '??';

  if (profile.metadata?.name) {
    const nameParts = profile.metadata.name.trim().split(' ');
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    }
    return nameParts[0].slice(0, 2).toUpperCase();
  }

  if (profile.email) {
    const emailName = profile.email.split('@')[0];
    return emailName.slice(0, 2).toUpperCase();
  }

  return '??';
};

/**
 * Get user display name
 */
const getDisplayName = (profile: UserProfile | undefined): string => {
  if (!profile) return 'Guest';

  if (profile.metadata?.name) {
    return profile.metadata.name;
  }

  if (profile.email) {
    const emailName = profile.email.split('@')[0];
    // Capitalize first letter
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
  }

  return 'User';
};

/**
 * Hook to manage user profile and aggregate stats
 */
export const useProfile = () => {
  // Fetch user profile
  const {
    data: profile,
    isLoading: isLoadingProfile,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ['userProfile'],
    queryFn: fetchUserProfile,
    staleTime: 0, // Always refetch to get latest avatar
    gcTime: 0, // Don't cache (previously cacheTime)
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (error?.message?.includes('not authenticated')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Get stats from existing hooks
  const {
    stats: prayerStatsData,
    isLoading: isLoadingPrayer,
  } = usePrayerStats();

  const {
    stats: sunnahStatsData,
    isLoading: isLoadingSunnah,
  } = useSunnahStats();

  const {
    progress: quranProgress,
    isLoading: isLoadingQuran,
  } = useQuranProgress();

  // Aggregate all stats
  let stats: ProfileStats | undefined = undefined;

  if (profile) {
    stats = {
      prayers: {
        totalLogged: prayerStatsData?.monthly?.totalPrayers || 0,
        onTimeCount: prayerStatsData?.monthly?.prayersLogged || 0,
        currentStreak: prayerStatsData?.streak?.currentStreak || 0,
        longestStreak: prayerStatsData?.streak?.longestStreak || 0,
      },
      quran: {
        totalMinutes: quranProgress?.totalMinutes || 0,
        totalPages: quranProgress?.totalPagesRead || 0,
        currentStreak: quranProgress?.currentStreak || 0,
        plansCompleted: quranProgress?.surahsCompleted || 0,
      },
      sunnah: {
        totalCompleted: sunnahStatsData?.monthly?.habitsLogged || 0,
        currentStreak: sunnahStatsData?.streak?.currentStreak || 0,
        categoriesActive: 0, // TODO: Add categories count when available
        milestonesEarned: sunnahStatsData?.milestones?.length || 0,
      },
      charity: {
        totalEntries: 0, // TODO: Add charity stats when available
      },
      reflections: {
        totalEntries: 0, // TODO: Add reflection stats when available
      },
      overall: {
        daysActive: Math.max(
          prayerStatsData?.streak?.currentStreak || 0,
          sunnahStatsData?.streak?.currentStreak || 0,
          quranProgress?.currentStreak || 0
        ),
        joinedDate: profile.created_at || profile.createdAt || new Date().toISOString(),
      },
    };
  }

  const isLoading = isLoadingProfile || isLoadingPrayer || isLoadingSunnah || isLoadingQuran;

  return {
    profile,
    stats,
    isLoading,
    error: profileError,
    refetch: refetchProfile,
    // Helper functions
    getUserInitials: () => getUserInitials(profile),
    getDisplayName: () => getDisplayName(profile),
  };
};

/**
 * Calculate days since user joined
 */
export const getDaysSinceJoined = (joinedDate: string): number => {
  const joined = new Date(joinedDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - joined.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};
