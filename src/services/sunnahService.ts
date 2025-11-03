/**
 * Sunnah Service
 * Handles all Sunnah habits data operations with Supabase
 */

import { supabase, getCurrentUser } from './supabase';
import type {
  SunnahCategory,
  SunnahHabit,
  SunnahLog,
  SunnahLevel,
  UserSunnahPreferences,
  SunnahMilestone,
  SunnahHabitWithCategory,
  SunnahHabitWithLog,
} from '../types';
import { sendStreakCelebration, type StreakMilestone } from './notificationScheduler';

import { createLogger } from '../utils/logger';

const logger = createLogger('sunnahService');

// ============= Categories =============

/**
 * Fetch all Sunnah categories
 * @returns Array of categories ordered by display_order
 */
export const fetchSunnahCategories = async (): Promise<SunnahCategory[]> => {
  const { data, error } = await supabase
    .from('sunnah_categories')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    logger.error('Error fetching Sunnah categories:', error);
    throw new Error('Failed to fetch Sunnah categories');
  }

  return data || [];
};

/**
 * Fetch a single category by ID
 */
export const fetchCategoryById = async (categoryId: string): Promise<SunnahCategory | null> => {
  const { data, error } = await supabase
    .from('sunnah_categories')
    .select('*')
    .eq('id', categoryId)
    .single();

  if (error) {
    logger.error('Error fetching category:', error);
    return null;
  }

  return data;
};

// ============= Habits =============

/**
 * Fetch all active Sunnah habits with categories
 * @param options - Optional filters (category, featured)
 * @returns Array of habits with category data
 */
export const fetchSunnahHabits = async (options?: {
  categoryId?: string;
  featured?: boolean;
}): Promise<SunnahHabitWithCategory[]> => {
  let query = supabase
    .from('sunnah_habits')
    .select(
      `
      *,
      category:sunnah_categories(*)
    `
    )
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (options?.categoryId) {
    query = query.eq('category_id', options.categoryId);
  }

  if (options?.featured) {
    query = query.eq('is_featured', true);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Error fetching Sunnah habits:', error);
    throw new Error('Failed to fetch Sunnah habits');
  }

  return (data || []) as SunnahHabitWithCategory[];
};

/**
 * Fetch habits with today's log status
 * @param date - Date to check logs for (ISO format)
 * @returns Habits with log data and streaks
 */
export const fetchHabitsWithLogs = async (date: string): Promise<SunnahHabitWithLog[]> => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Fetch all habits with categories
  const habits = await fetchSunnahHabits();

  // Fetch today's logs
  const { data: logs, error: logsError } = await supabase
    .from('sunnah_logs')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', date);

  if (logsError) {
    logger.error('Error fetching Sunnah logs:', logsError);
    throw new Error('Failed to fetch Sunnah logs');
  }

  // Fetch streaks for each habit
  const streaksPromises = habits.map(habit => calculateHabitStreak(habit.id, user.id));
  const streaks = await Promise.all(streaksPromises);

  // Fetch user preferences to check pinned habits
  const prefs = await fetchUserPreferences();
  const pinnedHabitIds = prefs?.pinned_habits || [];

  // Combine habits with log data
  return habits.map((habit, index) => ({
    ...habit,
    todayLog: logs?.find(log => log.habit_id === habit.id) || null,
    currentStreak: streaks[index],
    isPinned: pinnedHabitIds.includes(habit.id),
  }));
};

/**
 * Fetch a single habit by ID
 */
export const fetchHabitById = async (habitId: string): Promise<SunnahHabitWithCategory | null> => {
  const { data, error } = await supabase
    .from('sunnah_habits')
    .select(
      `
      *,
      category:sunnah_categories(*)
    `
    )
    .eq('id', habitId)
    .single();

  if (error) {
    logger.error('Error fetching habit:', error);
    return null;
  }

  return data as SunnahHabitWithCategory;
};

// ============= Logging =============

/**
 * Log a Sunnah habit completion
 * @param habitId - Habit to log
 * @param level - Level achieved (basic, companion, prophetic)
 * @param date - Date of completion (ISO format)
 * @param reflection - Optional reflection note
 */
export const logSunnahHabit = async (
  habitId: string,
  level: SunnahLevel,
  date: string,
  reflection?: string
): Promise<SunnahLog> => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const logData = {
    user_id: user.id,
    habit_id: habitId,
    date,
    level,
    reflection: reflection || null,
  };

  // Upsert (insert or update if exists)
  const { data, error } = await supabase
    .from('sunnah_logs')
    .upsert(logData, {
      onConflict: 'user_id,habit_id,date',
    })
    .select()
    .single();

  if (error) {
    logger.error('Error logging Sunnah habit:', error);
    throw new Error('Failed to log Sunnah habit');
  }

  // Check for milestones
  await checkAndAwardMilestones(user.id, habitId, level);

  return data;
};

/**
 * Update an existing log
 */
export const updateSunnahLog = async (
  logId: string,
  updates: { level?: SunnahLevel; reflection?: string }
): Promise<SunnahLog> => {
  const { data, error } = await supabase
    .from('sunnah_logs')
    .update(updates)
    .eq('id', logId)
    .select()
    .single();

  if (error) {
    logger.error('Error updating Sunnah log:', error);
    throw new Error('Failed to update Sunnah log');
  }

  return data;
};

/**
 * Delete a log
 */
export const deleteSunnahLog = async (logId: string): Promise<void> => {
  const { error } = await supabase.from('sunnah_logs').delete().eq('id', logId);

  if (error) {
    logger.error('Error deleting Sunnah log:', error);
    throw new Error('Failed to delete Sunnah log');
  }
};

/**
 * Fetch logs for a date range
 */
export const fetchLogsForDateRange = async (
  startDate: string,
  endDate: string
): Promise<SunnahLog[]> => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('sunnah_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  if (error) {
    logger.error('Error fetching Sunnah logs:', error);
    throw new Error('Failed to fetch Sunnah logs');
  }

  return data || [];
};

// ============= User Preferences =============

/**
 * Fetch user's Sunnah preferences
 */
export const fetchUserPreferences = async (): Promise<UserSunnahPreferences | null> => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('user_sunnah_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    // If no preferences exist, return default
    if (error.code === 'PGRST116') {
      return null;
    }
    logger.error('Error fetching user preferences:', error);
    throw new Error('Failed to fetch user preferences');
  }

  return data;
};

/**
 * Create or update user preferences
 */
export const upsertUserPreferences = async (
  preferences: Partial<Omit<UserSunnahPreferences, 'user_id' | 'created_at' | 'updated_at'>>
): Promise<UserSunnahPreferences> => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('user_sunnah_preferences')
    .upsert(
      {
        user_id: user.id,
        ...preferences,
      },
      {
        onConflict: 'user_id',
      }
    )
    .select()
    .single();

  if (error) {
    logger.error('Error upserting user preferences:', error);
    throw new Error('Failed to update user preferences');
  }

  return data;
};

/**
 * Pin a habit for daily recommendations
 */
export const pinHabit = async (habitId: string): Promise<void> => {
  const prefs = await fetchUserPreferences();
  const currentPinned = prefs?.pinned_habits || [];

  if (!currentPinned.includes(habitId)) {
    await upsertUserPreferences({
      pinned_habits: [...currentPinned, habitId],
    });
  }
};

/**
 * Unpin a habit
 */
export const unpinHabit = async (habitId: string): Promise<void> => {
  const prefs = await fetchUserPreferences();
  const currentPinned = prefs?.pinned_habits || [];

  await upsertUserPreferences({
    pinned_habits: currentPinned.filter(id => id !== habitId),
  });
};

// ============= Analytics & Insights =============

/**
 * Calculate current streak for a habit
 */
export const calculateHabitStreak = async (habitId: string, userId?: string): Promise<number> => {
  const user = userId ? { id: userId } : await getCurrentUser();
  if (!user) return 0;

  const { data, error } = await supabase
    .from('sunnah_logs')
    .select('date')
    .eq('user_id', user.id)
    .eq('habit_id', habitId)
    .order('date', { ascending: false })
    .limit(100); // Check last 100 days

  if (error || !data || data.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if there's a log for today or yesterday (to allow for timezone differences)
  const latestLog = new Date(data[0].date);
  latestLog.setHours(0, 0, 0, 0);

  const dayDiff = Math.floor((today.getTime() - latestLog.getTime()) / (1000 * 60 * 60 * 24));

  if (dayDiff > 1) {
    // Streak is broken
    return 0;
  }

  // Count consecutive days
  for (let i = 0; i < data.length; i++) {
    const currentDate = new Date(data[i].date);
    currentDate.setHours(0, 0, 0, 0);

    if (i === 0) {
      streak = 1;
      continue;
    }

    const prevDate = new Date(data[i - 1].date);
    prevDate.setHours(0, 0, 0, 0);

    const diff = Math.floor((prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

/**
 * Calculate overall Sunnah completion percentage for a date
 */
export const calculateDayCompletion = async (date: string): Promise<number> => {
  const user = await getCurrentUser();
  if (!user) return 0;

  const habits = await fetchSunnahHabits();
  const totalHabits = habits.length;

  if (totalHabits === 0) return 0;

  const { data: logs, error } = await supabase
    .from('sunnah_logs')
    .select('habit_id')
    .eq('user_id', user.id)
    .eq('date', date);

  if (error) return 0;

  const completed = logs?.length || 0;
  return Math.round((completed / totalHabits) * 100);
};

// ============= Milestones =============

/**
 * Check and award milestones for a habit
 */
const checkAndAwardMilestones = async (
  userId: string,
  habitId: string,
  level: SunnahLevel
): Promise<void> => {
  // Check for first log milestone
  const { data: existingLogs } = await supabase
    .from('sunnah_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('habit_id', habitId)
    .limit(1);

  if (existingLogs && existingLogs.length === 1) {
    await awardMilestone(userId, habitId, 'first_log');
  }

  // Check for streak milestones
  const streak = await calculateHabitStreak(habitId, userId);
  if (streak === 7) {
    await awardMilestone(userId, habitId, 'streak_7', streak);
  } else if (streak === 30) {
    await awardMilestone(userId, habitId, 'streak_30', streak);
  } else if (streak === 100) {
    await awardMilestone(userId, habitId, 'streak_100', streak);
  }

  // Check for level upgrade milestone
  // (Only if user has been doing this habit and upgraded to a higher level)
  const { data: previousLogs } = await supabase
    .from('sunnah_logs')
    .select('level')
    .eq('user_id', userId)
    .eq('habit_id', habitId)
    .order('logged_at', { ascending: false })
    .limit(2);

  if (previousLogs && previousLogs.length > 1) {
    const previousLevel = previousLogs[1].level;
    const levelOrder = { basic: 0, companion: 1, prophetic: 2 };
    if (levelOrder[level] > levelOrder[previousLevel as SunnahLevel]) {
      await awardMilestone(userId, habitId, 'level_upgrade', undefined, level);
    }
  }
};

/**
 * Award a milestone (insert if not exists)
 */
const awardMilestone = async (
  userId: string,
  habitId: string,
  type: SunnahMilestone['type'],
  value?: number,
  level?: SunnahLevel
): Promise<void> => {
  const { error, data } = await supabase
    .from('sunnah_milestones')
    .upsert(
      {
        user_id: userId,
        habit_id: habitId,
        type,
        value: value || null,
        level: level || null,
      },
      {
        onConflict: 'user_id,habit_id,type',
        ignoreDuplicates: true,
      }
    )
    .select();

  if (error) {
    logger.error('Error awarding milestone:', error);
    return;
  }

  // If milestone was newly created (not duplicate), send celebration
  if (data && data.length > 0) {
    // Send streak celebration notification
    if (type.startsWith('streak_') && value) {
      // Fetch habit name for notification
      const habit = await fetchHabitById(habitId);
      if (habit) {
        const milestone: StreakMilestone = {
          type: 'sunnah',
          name: habit.name,
          streakDays: value,
          level,
        };

        sendStreakCelebration(milestone).catch(err =>
          logger.error('Failed to send streak celebration:', err)
        );
      }
    }
  }
};

/**
 * Fetch user's milestones
 */
export const fetchUserMilestones = async (limit?: number): Promise<SunnahMilestone[]> => {
  const user = await getCurrentUser();
  if (!user) return [];

  let query = supabase
    .from('sunnah_milestones')
    .select('*')
    .eq('user_id', user.id)
    .order('achieved_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Error fetching milestones:', error);
    return [];
  }

  return data || [];
};

// ============= Recommendations =============

/**
 * Get daily recommended habits based on user preferences
 * Uses auto-cycle algorithm to rotate through unpinned habits
 * @param date - Date to get recommendations for
 * @returns Array of recommended habit IDs
 */
export const getDailyRecommendations = async (date: string): Promise<string[]> => {
  const user = await getCurrentUser();
  if (!user) return [];

  const prefs = await fetchUserPreferences();
  const pinnedHabits = prefs?.pinned_habits || [];
  const recommendationCount = prefs?.daily_recommendation_count || 5;

  // Always include pinned habits
  const recommendations = [...pinnedHabits];

  // If we need more, add from unpinned habits
  const needed = recommendationCount - pinnedHabits.length;
  if (needed > 0) {
    const allHabits = await fetchSunnahHabits();
    const unpinnedHabits = allHabits.filter(h => !pinnedHabits.includes(h.id));

    // Simple rotation: use date as seed for pseudo-random selection
    const dateNum = new Date(date).getDate();
    const startIndex = dateNum % unpinnedHabits.length;

    for (let i = 0; i < needed && i < unpinnedHabits.length; i++) {
      const index = (startIndex + i) % unpinnedHabits.length;
      recommendations.push(unpinnedHabits[index].id);
    }
  }

  return recommendations.slice(0, recommendationCount);
};
