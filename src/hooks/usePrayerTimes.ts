/**
 * usePrayerTimes Hook
 * React hook for managing prayer times based on user location
 */

import { useState, useEffect, useCallback } from 'react';
import { PrayerTimes as AdhanPrayerTimes } from 'adhan';
import {
  calculatePrayerTimes,
  getNextPrayer,
  getTimeUntilNextPrayer,
  formatTimeRemaining,
  formatPrayerTimeDisplay,
} from '../services/prayerTimes';
import { useCoordinates } from './useLocation';
import type { PrayerName } from '../types';

import { createLogger } from '../utils/logger';

const logger = createLogger('usePrayerTimes');

interface UsePrayerTimesState {
  prayerTimes: AdhanPrayerTimes | null;
  nextPrayer: {
    name: PrayerName;
    time: Date;
    timeRemaining: string;
  } | null;
  isLoading: boolean;
  error: string | null;
}

interface UsePrayerTimesReturn extends UsePrayerTimesState {
  refreshPrayerTimes: () => void;
  getPrayerTimeFormatted: (prayer: PrayerName) => string;
}

interface UsePrayerTimesOptions {
  calculationMethod?: string;
  asrMethod?: 'Standard' | 'Hanafi';
  timezone?: string;
  autoRefresh?: boolean; // Auto-refresh every minute to update time remaining
}

/**
 * Custom hook for managing prayer times
 * Automatically calculates prayer times based on user location
 *
 * @example
 * const { prayerTimes, nextPrayer, isLoading, error } = usePrayerTimes({
 *   calculationMethod: 'MuslimWorldLeague',
 *   asrMethod: 'Standard',
 * });
 */
export const usePrayerTimes = (
  options: UsePrayerTimesOptions = {}
): UsePrayerTimesReturn => {
  const {
    calculationMethod = 'MuslimWorldLeague',
    asrMethod = 'Standard',
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
    autoRefresh = true,
  } = options;

  const { coordinates, isLoading: locationLoading, error: locationError } = useCoordinates();

  const [state, setState] = useState<UsePrayerTimesState>({
    prayerTimes: null,
    nextPrayer: null,
    isLoading: true,
    error: null,
  });

  // Calculate prayer times when coordinates are available
  const calculateTimes = useCallback(() => {
    if (!coordinates) {
      setState((prev) => ({
        ...prev,
        isLoading: locationLoading,
        error: locationError ? locationError.message : null,
      }));
      return;
    }

    try {
      const times = calculatePrayerTimes({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        date: new Date(),
        calculationMethod,
        asrMethod,
        timezone,
      });

      if (!times) {
        setState((prev) => ({
          ...prev,
          error: 'Failed to calculate prayer times',
          isLoading: false,
        }));
        return;
      }

      const next = getNextPrayer(times);
      const nextPrayerData = next
        ? {
            name: next.prayer,
            time: next.time,
            timeRemaining: formatTimeRemaining(getTimeUntilNextPrayer(times)),
          }
        : null;

      setState({
        prayerTimes: times,
        nextPrayer: nextPrayerData,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error.message || 'Failed to calculate prayer times',
        isLoading: false,
      }));
    }
  }, [coordinates, calculationMethod, asrMethod, timezone, locationLoading, locationError]);

  // Calculate times when coordinates change
  useEffect(() => {
    calculateTimes();
  }, [calculateTimes]);

  // Auto-refresh time remaining every minute
  useEffect(() => {
    if (!autoRefresh || !state.prayerTimes) {
      return;
    }

    const interval = setInterval(() => {
      if (state.prayerTimes) {
        const next = getNextPrayer(state.prayerTimes);
        if (next) {
          setState((prev) => ({
            ...prev,
            nextPrayer: {
              name: next.prayer,
              time: next.time,
              timeRemaining: formatTimeRemaining(getTimeUntilNextPrayer(state.prayerTimes!)),
            },
          }));
        }
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [autoRefresh, state.prayerTimes]);

  /**
   * Manually refresh prayer times (useful for pull-to-refresh)
   */
  const refreshPrayerTimes = useCallback(() => {
    calculateTimes();
  }, [calculateTimes]);

  /**
   * Get formatted prayer time for display
   */
  const getPrayerTimeFormatted = useCallback(
    (prayer: PrayerName): string => {
      if (!state.prayerTimes) return '--:--';

      try {
        const prayerMap = {
          fajr: state.prayerTimes.fajr,
          dhuhr: state.prayerTimes.dhuhr,
          asr: state.prayerTimes.asr,
          maghrib: state.prayerTimes.maghrib,
          isha: state.prayerTimes.isha,
        };

        const time = prayerMap[prayer];
        if (!time) return '--:--';

        return formatPrayerTimeDisplay(time.toISOString(), timezone, true);
      } catch (error) {
        logger.error('Error formatting prayer time:', error);
        return '--:--';
      }
    },
    [state.prayerTimes, timezone]
  );

  return {
    ...state,
    refreshPrayerTimes,
    getPrayerTimeFormatted,
  };
};

/**
 * Hook to get only the next prayer information
 * Lighter alternative when you only need next prayer data
 */
export const useNextPrayer = (options: UsePrayerTimesOptions = {}) => {
  const { nextPrayer, isLoading, error, refreshPrayerTimes } = usePrayerTimes(options);

  return {
    nextPrayer,
    isLoading,
    error,
    refresh: refreshPrayerTimes,
  };
};

/**
 * Hook to check if a specific prayer time has passed
 */
export const usePrayerStatus = (options: UsePrayerTimesOptions = {}) => {
  const { prayerTimes } = usePrayerTimes(options);
  const now = new Date();

  const getPrayerStatus = useCallback(
    (prayer: PrayerName): 'upcoming' | 'current' | 'passed' => {
      if (!prayerTimes) return 'upcoming';

      const prayerMap = {
        fajr: prayerTimes.fajr,
        dhuhr: prayerTimes.dhuhr,
        asr: prayerTimes.asr,
        maghrib: prayerTimes.maghrib,
        isha: prayerTimes.isha,
      };

      const time = prayerMap[prayer];
      if (!time) return 'upcoming';

      if (now < time) return 'upcoming';

      // Check if current prayer
      const currentPrayer = prayerTimes.currentPrayer(now);

      if (currentPrayer === prayer) return 'current';

      return 'passed';
    },
    [prayerTimes, now]
  );

  return { getPrayerStatus };
};
