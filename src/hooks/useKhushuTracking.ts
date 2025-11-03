/**
 * Khushu Level Tracking Hook
 * Saves and retrieves daily khushu levels to/from journal_entries table
 */

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { supabase } from '../services/supabase';
import { createLogger } from '../utils/logger';

const logger = createLogger('useKhushuTracking');

export interface UseKhushuTrackingOptions {
  date?: string; // ISO date string (YYYY-MM-DD), defaults to today
}

export const useKhushuTracking = (options: UseKhushuTrackingOptions = {}) => {
  const [khushuLevel, setKhushuLevel] = useState<number>(50); // Default: 50
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const date = options.date || format(new Date(), 'yyyy-MM-dd');

  /**
   * Load khushu level for the specified date
   */
  const loadKhushuLevel = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error: fetchError } = await supabase
        .from('journal_entries')
        .select('khushu_level')
        .eq('user_id', user.id)
        .eq('date', date)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is fine
        throw fetchError;
      }

      // Set khushu level if found, otherwise keep default (50)
      if (data && data.khushu_level !== null) {
        // Convert from 1-5 scale in DB to 0-100 scale for slider
        setKhushuLevel(data.khushu_level * 20);
      }
    } catch (err) {
      logger.error('Error loading khushu level:', err);
      setError(err instanceof Error ? err.message : 'Failed to load khushu level');
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  /**
   * Save khushu level to database
   * @param value - Khushu level (0-100)
   */
  const saveKhushuLevel = async (value: number) => {
    setIsSaving(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Convert from 0-100 scale to 1-5 scale for database
      const dbValue = Math.ceil(value / 20) || 1; // Ensure minimum of 1

      // Upsert journal entry with khushu level
      const { error: upsertError } = await supabase
        .from('journal_entries')
        .upsert(
          {
            user_id: user.id,
            date,
            khushu_level: dbValue,
            text: '', // Empty text, can be filled later via journal screen
          },
          {
            onConflict: 'user_id,date',
          }
        );

      if (upsertError) {
        throw upsertError;
      }

      // Update local state
      setKhushuLevel(value);
    } catch (err) {
      logger.error('Error saving khushu level:', err);
      setError(err instanceof Error ? err.message : 'Failed to save khushu level');
      throw err; // Re-throw to allow UI to handle errors
    } finally {
      setIsSaving(false);
    }
  };

  // Load khushu level on mount and when date changes
  useEffect(() => {
    loadKhushuLevel();
  }, [date, loadKhushuLevel]);

  return {
    khushuLevel,
    isLoading,
    isSaving,
    error,
    saveKhushuLevel,
    refreshKhushuLevel: loadKhushuLevel,
  };
};

export default useKhushuTracking;
