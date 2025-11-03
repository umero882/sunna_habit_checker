/**
 * useReciterPreference Hook
 * Manages user's preferred Qur'an reciter selection
 * Stores preference in AsyncStorage and syncs with Supabase
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';
import { DEFAULT_RECITER, AVAILABLE_RECITERS } from '../constants/quran';
import { ReciterInfo } from '../types';

import { createLogger } from '../utils/logger';

const logger = createLogger('useReciterPreference');

const RECITER_STORAGE_KEY = '@quran:preferred_reciter';

interface UseReciterPreferenceReturn {
  reciter: string;
  reciterInfo: ReciterInfo | null;
  setReciter: (reciterId: string) => Promise<void>;
  isLoading: boolean;
  availableReciters: ReciterInfo[];
}

export const useReciterPreference = (userId?: string): UseReciterPreferenceReturn => {
  const [reciter, setReciterState] = useState<string>(DEFAULT_RECITER);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load reciter preference from storage and Supabase
   */
  useEffect(() => {
    const loadReciterPreference = async () => {
      try {
        // First, try to load from AsyncStorage (fast, offline-first)
        const storedReciter = await AsyncStorage.getItem(RECITER_STORAGE_KEY);

        if (storedReciter && isValidReciter(storedReciter)) {
          setReciterState(storedReciter);
        }

        // Then, if user is logged in, sync with Supabase
        if (userId) {
          const { data, error } = await supabase
            .from('user_quran_preferences')
            .select('reciter')
            .eq('user_id', userId)
            .single();

          if (!error && data?.reciter && isValidReciter(data.reciter)) {
            setReciterState(data.reciter);
            // Update local storage to match server
            await AsyncStorage.setItem(RECITER_STORAGE_KEY, data.reciter);
          }
        }
      } catch (error) {
        logger.error('Failed to load reciter preference:', error);
        // Fallback to default
        setReciterState(DEFAULT_RECITER);
      } finally {
        setIsLoading(false);
      }
    };

    loadReciterPreference();
  }, [userId]);

  /**
   * Validate reciter ID exists in available reciters
   */
  const isValidReciter = (reciterId: string): boolean => {
    return AVAILABLE_RECITERS.some((r) => r.id === reciterId);
  };

  /**
   * Get reciter info by ID
   */
  const getReciterInfo = useCallback((reciterId: string): ReciterInfo | null => {
    return AVAILABLE_RECITERS.find((r) => r.id === reciterId) || null;
  }, []);

  /**
   * Update reciter preference
   */
  const setReciter = useCallback(async (reciterId: string) => {
    if (!isValidReciter(reciterId)) {
      logger.error(`Invalid reciter ID: ${reciterId}`);
      return;
    }

    try {
      // Update local state immediately
      setReciterState(reciterId);

      // Save to AsyncStorage
      await AsyncStorage.setItem(RECITER_STORAGE_KEY, reciterId);

      // If user is logged in, sync to Supabase
      if (userId) {
        const { error } = await supabase
          .from('user_quran_preferences')
          .upsert({
            user_id: userId,
            reciter: reciterId,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id'
          });

        if (error) {
          logger.error('Failed to save reciter to Supabase:', error);
          // Don't throw - local storage update succeeded
        } else {
          logger.debug(`Reciter preference saved: ${reciterId}`);
        }
      }
    } catch (error) {
      logger.error('Failed to update reciter preference:', error);
      // Revert to previous state on error
      const storedReciter = await AsyncStorage.getItem(RECITER_STORAGE_KEY);
      if (storedReciter) {
        setReciterState(storedReciter);
      }
    }
  }, [userId]);

  return {
    reciter,
    reciterInfo: getReciterInfo(reciter),
    setReciter,
    isLoading,
    availableReciters: AVAILABLE_RECITERS,
  };
};

export default useReciterPreference;
