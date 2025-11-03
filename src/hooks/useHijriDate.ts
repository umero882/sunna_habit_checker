/**
 * useHijriDate Hook
 * React hook for Hijri calendar date conversion and formatting
 */

import { useState, useEffect } from 'react';
import {
  gregorianToHijri,
  formatHijriDate,
  formatBothCalendars,
  type HijriDate,
} from '../utils/hijriDate';

export interface UseHijriDateOptions {
  date?: Date;
  locale?: 'en' | 'ar';
  updateInterval?: number; // Auto-update interval (ms), default 0 (no auto-update)
}

export interface UseHijriDateReturn {
  hijriDate: HijriDate;
  formatted: string;
  formattedBoth: { gregorian: string; hijri: string };
  gregorianDate: Date;
}

/**
 * Hook for Hijri date conversion and formatting
 *
 * @param options - Configuration options
 * @returns Hijri date data
 *
 * @example
 * const { hijriDate, formatted, formattedBoth } = useHijriDate({ locale: 'en' });
 * // hijriDate: { day: 29, month: 4, year: 1447, ... }
 * // formatted: "29 Rabi al-Thani 1447 AH"
 * // formattedBoth: { gregorian: "October 31, 2025", hijri: "29 Rabi al-Thani 1447 AH" }
 */
export function useHijriDate(options: UseHijriDateOptions = {}): UseHijriDateReturn {
  const { date: initialDate = new Date(), locale = 'en', updateInterval = 0 } = options;

  const [gregorianDate, setGregorianDate] = useState<Date>(initialDate);

  const hijriDate = gregorianToHijri(gregorianDate);
  const formatted = formatHijriDate(hijriDate, locale);
  const formattedBoth = formatBothCalendars(gregorianDate, locale);

  useEffect(() => {
    if (updateInterval > 0) {
      // Auto-update date at midnight or at specified interval
      const interval = setInterval(() => {
        setGregorianDate(new Date());
      }, updateInterval);

      return () => clearInterval(interval);
    }
  }, [updateInterval]);

  return {
    hijriDate,
    formatted,
    formattedBoth,
    gregorianDate,
  };
}

/**
 * Hook to get formatted date strings for both calendars
 *
 * @param locale - Language for formatting
 * @returns Formatted Gregorian and Hijri dates
 *
 * @example
 * const { gregorian, hijri } = useFormattedDates('en');
 * // gregorian: "October 31, 2025"
 * // hijri: "29 Rabi al-Thani 1447 AH"
 */
export function useFormattedDates(locale: 'en' | 'ar' = 'en') {
  const { formattedBoth } = useHijriDate({ locale });
  return formattedBoth;
}
