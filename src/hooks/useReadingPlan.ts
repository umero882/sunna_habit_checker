/**
 * useReadingPlan Hook
 * Manages Qur'an reading plans, progress tracking, and logging
 */

import { useState, useEffect, useCallback } from 'react';
import { QuranPlan, QuranReadingLog, ReadingMode } from '../types';
import { supabase } from '../services/supabase';
import { format } from 'date-fns';

import { createLogger } from '../utils/logger';

const logger = createLogger('useReadingPlan');

interface UseReadingPlanReturn {
  activePlan: QuranPlan | null;
  plans: QuranPlan[];
  isLoading: boolean;
  error: Error | null;
  createPlan: (plan: Partial<QuranPlan>) => Promise<void>;
  updatePlan: (planId: string, updates: Partial<QuranPlan>) => Promise<void>;
  deletePlan: (planId: string) => Promise<void>;
  logReading: (log: Partial<QuranReadingLog>) => Promise<void>;
  getTodayProgress: () => Promise<{ completed: number; target: number }>;
  completePlan: (planId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useReadingPlan = (userId?: string): UseReadingPlanReturn => {
  const [activePlan, setActivePlan] = useState<QuranPlan | null>(null);
  const [plans, setPlans] = useState<QuranPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch all plans for user
   */
  const fetchPlans = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('quran_plans')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setPlans(data || []);

      // Find active plan
      const active = data?.find(plan => plan.active);
      setActivePlan(active || null);
    } catch (err) {
      logger.error('Error fetching plans:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * Create a new reading plan
   */
  const createPlan = useCallback(
    async (plan: Partial<QuranPlan>) => {
      if (!userId) throw new Error('User ID required');

      try {
        // Deactivate other plans if this is active
        if (plan.active) {
          await supabase
            .from('quran_plans')
            .update({ active: false })
            .eq('user_id', userId)
            .eq('active', true);
        }

        const { data, error: insertError } = await supabase
          .from('quran_plans')
          .insert([
            {
              user_id: userId,
              ...plan,
              started_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (insertError) throw insertError;

        // Refetch plans
        await fetchPlans();

        logger.debug('Plan created successfully');
      } catch (err) {
        logger.error('Error creating plan:', err);
        throw err;
      }
    },
    [userId, fetchPlans]
  );

  /**
   * Update an existing plan
   */
  const updatePlan = useCallback(
    async (planId: string, updates: Partial<QuranPlan>) => {
      try {
        const { error: updateError } = await supabase
          .from('quran_plans')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', planId);

        if (updateError) throw updateError;

        await fetchPlans();
        logger.debug('Plan updated successfully');
      } catch (err) {
        logger.error('Error updating plan:', err);
        throw err;
      }
    },
    [fetchPlans]
  );

  /**
   * Delete a plan
   */
  const deletePlan = useCallback(
    async (planId: string) => {
      try {
        const { error: deleteError } = await supabase.from('quran_plans').delete().eq('id', planId);

        if (deleteError) throw deleteError;

        await fetchPlans();
        logger.debug('Plan deleted successfully');
      } catch (err) {
        logger.error('Error deleting plan:', err);
        throw err;
      }
    },
    [fetchPlans]
  );

  /**
   * Log a reading session
   */
  const logReading = useCallback(
    async (log: Partial<QuranReadingLog>) => {
      if (!userId) throw new Error('User ID required');

      try {
        // Ensure pages_read is rounded to integer if provided (database constraint)
        const pagesRead = log.pages_read !== undefined ? Math.round(log.pages_read) : undefined;

        const { error: insertError } = await supabase.from('quran_reading_logs').insert([
          {
            user_id: userId,
            date: format(new Date(), 'yyyy-MM-dd'),
            ...log,
            pages_read: pagesRead,
            logged_at: new Date().toISOString(),
          },
        ]);

        if (insertError) throw insertError;

        // Update plan progress if there's an active plan
        if (activePlan) {
          let progressIncrement = 0;

          switch (activePlan.mode) {
            case 'pages':
              progressIncrement = pagesRead || 0;
              break;
            case 'verses':
              progressIncrement = (log.to_ayah || 0) - (log.from_ayah || 0) + 1;
              break;
            case 'time':
              progressIncrement = log.duration_minutes || 0;
              break;
          }

          const newCompleted = activePlan.completed + progressIncrement;
          await updatePlan(activePlan.id, { completed: newCompleted });

          // Check if plan is complete
          if (activePlan.total_target && newCompleted >= activePlan.total_target) {
            await completePlan(activePlan.id);
          }
        }

        logger.debug('Reading logged successfully');
      } catch (err) {
        logger.error('Error logging reading:', err);
        throw err;
      }
    },
    [userId, activePlan, updatePlan]
  );

  /**
   * Get today's progress
   */
  const getTodayProgress = useCallback(async (): Promise<{ completed: number; target: number }> => {
    if (!userId || !activePlan) {
      return { completed: 0, target: 0 };
    }

    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      const { data, error: fetchError } = await supabase
        .from('quran_reading_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today);

      if (fetchError) throw fetchError;

      let completed = 0;

      switch (activePlan.mode) {
        case 'pages':
          completed = data?.reduce((sum, log) => sum + (log.pages_read || 0), 0) || 0;
          break;
        case 'verses':
          completed = data?.reduce((sum, log) => sum + (log.to_ayah - log.from_ayah + 1), 0) || 0;
          break;
        case 'time':
          completed = data?.reduce((sum, log) => sum + (log.duration_minutes || 0), 0) || 0;
          break;
      }

      return {
        completed,
        target: activePlan.target_per_day,
      };
    } catch (err) {
      logger.error('Error getting today progress:', err);
      return { completed: 0, target: 0 };
    }
  }, [userId, activePlan]);

  /**
   * Mark plan as completed
   */
  const completePlan = useCallback(
    async (planId: string) => {
      try {
        await updatePlan(planId, {
          active: false,
          completed_at: new Date().toISOString(),
        });

        logger.debug('Plan completed!');
      } catch (err) {
        logger.error('Error completing plan:', err);
        throw err;
      }
    },
    [updatePlan]
  );

  /**
   * Refetch all data
   */
  const refetch = useCallback(async () => {
    await fetchPlans();
  }, [fetchPlans]);

  /**
   * Load plans on mount
   */
  useEffect(() => {
    if (userId) {
      fetchPlans();
    }
  }, [userId, fetchPlans]);

  return {
    activePlan,
    plans,
    isLoading,
    error,
    createPlan,
    updatePlan,
    deletePlan,
    logReading,
    getTodayProgress,
    completePlan,
    refetch,
  };
};

export default useReadingPlan;
