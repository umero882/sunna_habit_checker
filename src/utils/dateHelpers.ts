/**
 * Date Helper Utilities
 * Functions for date manipulation and Islamic calendar support
 */

import { format, getDay } from 'date-fns';
import type { PrayerName } from '../types';

/**
 * Check if a given date is Friday
 * @param date - Date to check (defaults to today)
 * @returns true if the date is Friday
 */
export const isFriday = (date: Date = new Date()): boolean => {
  // getDay() returns 0 for Sunday, 5 for Friday
  return getDay(date) === 5;
};

/**
 * Check if today is Friday
 * @returns true if today is Friday
 */
export const isTodayFriday = (): boolean => {
  return isFriday(new Date());
};

/**
 * Check if a prayer is Jumu'ah (Friday Dhuhr prayer)
 * @param prayer - Prayer name
 * @param date - Date to check (defaults to today)
 * @returns true if it's Friday and the prayer is Dhuhr
 */
export const isJumuahPrayer = (
  prayer: PrayerName,
  date: Date = new Date()
): boolean => {
  return prayer === 'dhuhr' && isFriday(date);
};

/**
 * Get day name in English
 * @param date - Date to check (defaults to today)
 * @returns Day name (e.g., 'Monday', 'Tuesday', etc.)
 */
export const getDayName = (date: Date = new Date()): string => {
  return format(date, 'EEEE');
};

/**
 * Get day name in Arabic
 * @param date - Date to check (defaults to today)
 * @returns Day name in Arabic
 */
export const getDayNameArabic = (date: Date = new Date()): string => {
  const dayIndex = getDay(date);
  const arabicDays = [
    'الأحد',    // Sunday
    'الاثنين',  // Monday
    'الثلاثاء', // Tuesday
    'الأربعاء', // Wednesday
    'الخميس',   // Thursday
    'الجمعة',   // Friday
    'السبت',    // Saturday
  ];
  return arabicDays[dayIndex];
};

/**
 * Format date in Islamic style
 * @param date - Date to format
 * @returns Formatted date string
 */
export const formatIslamicDate = (date: Date = new Date()): string => {
  return format(date, 'yyyy-MM-dd');
};

/**
 * Check if date is within Friday time (Thursday sunset to Friday sunset)
 * Note: This is a simplified check. For accurate Islamic time, you would need
 * to calculate actual sunset times based on location.
 * @param date - Date to check (defaults to now)
 * @returns true if within Friday time period
 */
export const isWithinFridayTime = (date: Date = new Date()): boolean => {
  const dayOfWeek = getDay(date);
  const hour = date.getHours();

  // Friday (all day)
  if (dayOfWeek === 5) {
    return true;
  }

  // Thursday evening (after 6 PM as approximation for sunset)
  if (dayOfWeek === 4 && hour >= 18) {
    return true;
  }

  return false;
};

/**
 * Get greeting based on time of day
 * @param date - Date to check (defaults to now)
 * @returns Appropriate Islamic greeting
 */
export const getIslamicGreeting = (date: Date = new Date()): string => {
  const hour = date.getHours();

  if (hour >= 5 && hour < 12) {
    return 'Assalamu Alaikum - Good Morning';
  } else if (hour >= 12 && hour < 17) {
    return 'Assalamu Alaikum - Good Afternoon';
  } else if (hour >= 17 && hour < 20) {
    return 'Assalamu Alaikum - Good Evening';
  } else {
    return 'Assalamu Alaikum - Good Night';
  }
};

/**
 * Check if it's time for Friday Sunnah reminder
 * (Before Jumu'ah prayer time)
 * @param date - Date to check (defaults to now)
 * @returns true if it's Friday morning/early afternoon
 */
export const shouldShowFridayReminder = (date: Date = new Date()): boolean => {
  if (!isFriday(date)) return false;

  const hour = date.getHours();
  // Show reminder from Fajr (5 AM) until Dhuhr time (around 1 PM)
  return hour >= 5 && hour < 13;
};
