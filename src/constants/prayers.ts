/**
 * Prayer Constants
 * Shared constants related to Islamic prayers
 */

import type { PrayerName } from '../types';

/**
 * Prayer display names
 */
export const PRAYER_NAMES: Record<PrayerName, string> = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

/**
 * Prayer Arabic names
 */
export const PRAYER_NAMES_AR: Record<PrayerName, string> = {
  fajr: 'الفجر',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
};

/**
 * Prayer icons (emoji/symbols)
 */
export const PRAYER_ICONS: Record<PrayerName, string> = {
  fajr: '🌅',
  dhuhr: '☀️',
  asr: '🌤️',
  maghrib: '🌆',
  isha: '🌙',
};
