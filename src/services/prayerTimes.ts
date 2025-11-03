/**
 * Prayer Times Calculation Service
 * Uses adhan library for accurate Islamic prayer times
 */

import {
  Coordinates,
  CalculationMethod,
  PrayerTimes as AdhanPrayerTimes,
  Prayer,
  Madhab,
} from 'adhan';
import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import type { PrayerTimes, PrayerOffsets, PrayerName } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('PrayerTimes');

export interface CalculationParams {
  latitude: number;
  longitude: number;
  date: Date;
  calculationMethod?: string;
  asrMethod?: 'Standard' | 'Hanafi';
  timezone?: string;
  offsets?: PrayerOffsets;
}

/**
 * Get calculation method from string
 */
export const getCalculationMethod = (
  method?: string
): (typeof CalculationMethod)[keyof typeof CalculationMethod] => {
  switch (method) {
    case 'MuslimWorldLeague':
      return CalculationMethod.MuslimWorldLeague;
    case 'Egyptian':
      return CalculationMethod.Egyptian;
    case 'Karachi':
      return CalculationMethod.Karachi;
    case 'UmmAlQura':
      return CalculationMethod.UmmAlQura;
    case 'Dubai':
      return CalculationMethod.Dubai;
    case 'Qatar':
      return CalculationMethod.Qatar;
    case 'Kuwait':
      return CalculationMethod.Kuwait;
    case 'MoonsightingCommittee':
      return CalculationMethod.MoonsightingCommittee;
    case 'Singapore':
      return CalculationMethod.Singapore;
    case 'NorthAmerica':
      return CalculationMethod.NorthAmerica;
    case 'Turkey':
      return CalculationMethod.Turkey;
    case 'Tehran':
      return CalculationMethod.Tehran;
    default:
      return CalculationMethod.MuslimWorldLeague;
  }
};

/**
 * Apply time offsets to a date
 */
const applyOffset = (date: Date, offsetMinutes?: number): Date => {
  if (!offsetMinutes) return date;
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + offsetMinutes);
  return result;
};

/**
 * Calculate prayer times for a given location and date
 */
export const calculatePrayerTimes = (params: CalculationParams): AdhanPrayerTimes | null => {
  try {
    const { latitude, longitude, date, calculationMethod, asrMethod } = params;

    // Create coordinates
    const coordinates = new Coordinates(latitude, longitude);

    // Get calculation method
    const method = getCalculationMethod(calculationMethod);
    const calcParams = method();

    // Set Asr calculation method (Madhab)
    if (asrMethod === 'Hanafi') {
      calcParams.madhab = Madhab.Hanafi;
    } else {
      calcParams.madhab = Madhab.Shafi;
    }

    // Calculate prayer times
    const prayerTimes = new AdhanPrayerTimes(coordinates, date, calcParams);

    return prayerTimes;
  } catch (error) {
    logger.error('Error calculating prayer times:', error);
    return null;
  }
};

/**
 * Format prayer times for storage
 */
export const formatPrayerTimes = (
  prayerTimes: AdhanPrayerTimes,
  userId: string,
  date: Date,
  timezone: string = 'Asia/Dubai',
  calcMethod: string = 'MuslimWorldLeague',
  offsets?: PrayerOffsets
): Omit<PrayerTimes, 'id'> => {
  // Apply offsets
  const fajrTime = applyOffset(prayerTimes.fajr, offsets?.fajr);
  const sunriseTime = prayerTimes.sunrise;
  const dhuhrTime = applyOffset(prayerTimes.dhuhr, offsets?.dhuhr);
  const asrTime = applyOffset(prayerTimes.asr, offsets?.asr);
  const maghribTime = applyOffset(prayerTimes.maghrib, offsets?.maghrib);
  const ishaTime = applyOffset(prayerTimes.isha, offsets?.isha);

  return {
    userId,
    date: format(date, 'yyyy-MM-dd'),
    fajr: fajrTime.toISOString(),
    sunrise: sunriseTime.toISOString(),
    dhuhr: dhuhrTime.toISOString(),
    asr: asrTime.toISOString(),
    maghrib: maghribTime.toISOString(),
    isha: ishaTime.toISOString(),
    calcMethod,
    offsets,
  };
};

/**
 * Get next prayer
 */
export const getNextPrayer = (
  prayerTimes: AdhanPrayerTimes
): {
  prayer: PrayerName;
  time: Date;
} | null => {
  const now = new Date();
  const currentPrayer = prayerTimes.currentPrayer(now);
  const nextPrayer = prayerTimes.nextPrayer(now);

  if (!nextPrayer) return null;

  const prayerMap: Record<(typeof Prayer)[keyof typeof Prayer], PrayerName> = {
    [Prayer.Fajr]: 'fajr',
    [Prayer.Dhuhr]: 'dhuhr',
    [Prayer.Asr]: 'asr',
    [Prayer.Maghrib]: 'maghrib',
    [Prayer.Isha]: 'isha',
    [Prayer.Sunrise]: 'fajr', // Map sunrise to fajr for simplicity
    [Prayer.None]: 'fajr', // When no more prayers today, next is Fajr tomorrow
  };

  // Debug logging
  logger.debug('nextPrayer:', nextPrayer);
  logger.debug('Prayer.None value:', Prayer.None);
  logger.debug('is Prayer.None?', nextPrayer === Prayer.None);

  let prayerTime: Date;

  // If nextPrayer is None, all prayers for today have passed
  // We need to get tomorrow's Fajr
  if (nextPrayer === Prayer.None) {
    logger.debug("All prayers passed, getting tomorrow's Fajr");
    // Calculate tomorrow's date
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // IMPORTANT: Adding 24 hours is an approximation
    // Prayer times shift throughout the year due to seasonal changes in daylight
    // For production use, ideally recalculate prayer times for tomorrow using the same
    // coordinates and calculation method as the current prayerTimes object
    // This approximation works reasonably well for most locations (±5-10 min accuracy)
    // TODO: Consider passing coordinates/params to this function for accurate recalculation
    prayerTime = new Date(prayerTimes.fajr);
    prayerTime.setDate(prayerTime.getDate() + 1);
    logger.debug("Tomorrow's Fajr (approximation):", prayerTime);
  } else {
    prayerTime = prayerTimes.timeForPrayer(nextPrayer) || now;
    logger.debug('Prayer time from Adhan:', prayerTime);
  }

  logger.debug('Current time:', now);
  logger.debug('Is in past?', prayerTime.getTime() <= now.getTime());

  // Double-check: If the prayer time is still in the past or equal to now, add 24 hours
  if (prayerTime.getTime() <= now.getTime()) {
    prayerTime = new Date(prayerTime.getTime() + 24 * 60 * 60 * 1000);
    logger.debug('Adjusted prayer time (tomorrow):', prayerTime);
  }

  const result = {
    prayer: prayerMap[nextPrayer],
    time: prayerTime,
  };

  logger.debug('Final result:', result);
  return result;
};

/**
 * Get time remaining until next prayer
 */
export const getTimeUntilNextPrayer = (prayerTimes: AdhanPrayerTimes): number => {
  const next = getNextPrayer(prayerTimes);
  if (!next) return 0;

  const now = new Date();
  const diff = next.time.getTime() - now.getTime();
  return Math.max(0, diff);
};

/**
 * Format time remaining as string
 */
export const formatTimeRemaining = (milliseconds: number): string => {
  const totalMinutes = Math.floor(milliseconds / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

/**
 * Check if a prayer time has passed
 */
export const hasPrayerTimePassed = (prayerTime: string): boolean => {
  const now = new Date();
  const time = parseISO(prayerTime);
  return now > time;
};

/**
 * Get prayer time for a specific prayer
 */
export const getPrayerTime = (prayerTimes: PrayerTimes, prayer: PrayerName): string => {
  return prayerTimes[prayer];
};

/**
 * Format prayer time for display
 */
export const formatPrayerTimeDisplay = (
  timeString: string,
  timezone: string = 'Asia/Dubai',
  format12Hour: boolean = true
): string => {
  try {
    const date = parseISO(timeString);
    const formatString = format12Hour ? 'h:mm a' : 'HH:mm';
    return formatInTimeZone(date, timezone, formatString);
  } catch (error) {
    logger.error('Error formatting prayer time:', error);
    return '';
  }
};

/**
 * Get all calculation methods
 */
export const getAvailableCalculationMethods = (): Array<{ value: string; label: string }> => {
  return [
    { value: 'MuslimWorldLeague', label: 'Muslim World League' },
    { value: 'Egyptian', label: 'Egyptian General Authority' },
    { value: 'Karachi', label: 'University of Islamic Sciences, Karachi' },
    { value: 'UmmAlQura', label: 'Umm al-Qura University, Makkah' },
    { value: 'Dubai', label: 'Dubai (unofficial)' },
    { value: 'Qatar', label: 'Qatar' },
    { value: 'Kuwait', label: 'Kuwait' },
    { value: 'MoonsightingCommittee', label: 'Moonsighting Committee' },
    { value: 'Singapore', label: 'Singapore' },
    { value: 'NorthAmerica', label: 'Islamic Society of North America' },
    { value: 'Turkey', label: 'Turkey' },
    { value: 'Tehran', label: 'Institute of Geophysics, Tehran' },
  ];
};
