/**
 * Hijri Calendar Utilities
 * Converts Gregorian dates to Islamic (Hijri) calendar
 * Based on Umm al-Qura calendar calculation
 */

/**
 * Hijri month names in Arabic and English
 */
export const HIJRI_MONTHS_AR = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الثاني',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة',
];

export const HIJRI_MONTHS_EN = [
  'Muharram',
  'Safar',
  'Rabi al-Awwal',
  'Rabi al-Thani',
  'Jumada al-Awwal',
  'Jumada al-Thani',
  'Rajab',
  'Shaban',
  'Ramadan',
  'Shawwal',
  'Dhul-Qadah',
  'Dhul-Hijjah',
];

export interface HijriDate {
  day: number;
  month: number; // 1-12
  year: number;
  monthNameAr: string;
  monthNameEn: string;
}

/**
 * Convert Gregorian date to Hijri date
 * Uses algorithmic conversion (approximate, may differ by 1-2 days from official calendar)
 *
 * @param date - Gregorian date to convert
 * @returns Hijri date object
 */
export function gregorianToHijri(date: Date): HijriDate {
  // Julian Day Number calculation
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // JS months are 0-indexed
  const day = date.getDate();

  // Calculate Julian Day Number
  let a = Math.floor((14 - month) / 12);
  let y = year + 4800 - a;
  let m = month + 12 * a - 3;

  let jdn =
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;

  // Convert JDN to Hijri
  // Islamic calendar epoch (July 16, 622 CE)
  const islamicEpoch = 1948439.5;

  // Calculate Hijri date from JDN
  const l = jdn - islamicEpoch + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;

  const j =
    Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
    Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);

  const l3 =
    l2 -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;

  const hijriMonth = Math.floor((24 * l3) / 709);
  const hijriDay = l3 - Math.floor((709 * hijriMonth) / 24);
  const hijriYear = 30 * n + j - 30;

  return {
    day: hijriDay,
    month: hijriMonth,
    year: hijriYear,
    monthNameAr: HIJRI_MONTHS_AR[hijriMonth - 1],
    monthNameEn: HIJRI_MONTHS_EN[hijriMonth - 1],
  };
}

/**
 * Format Hijri date for display
 *
 * @param hijriDate - Hijri date object
 * @param locale - Language for month name ('ar' | 'en')
 * @returns Formatted date string
 *
 * @example
 * formatHijriDate({ day: 15, month: 9, year: 1446, ... }, 'en')
 * // Returns: "15 Ramadan 1446"
 *
 * formatHijriDate({ day: 15, month: 9, year: 1446, ... }, 'ar')
 * // Returns: "15 رمضان 1446"
 */
export function formatHijriDate(hijriDate: HijriDate, locale: 'ar' | 'en' = 'en'): string {
  const monthName = locale === 'ar' ? hijriDate.monthNameAr : hijriDate.monthNameEn;

  if (locale === 'ar') {
    // RTL format: day month year in Arabic
    return `${hijriDate.day} ${monthName} ${hijriDate.year} هـ`;
  }

  return `${hijriDate.day} ${monthName} ${hijriDate.year} AH`;
}

/**
 * Format Gregorian date for display
 *
 * @param date - Gregorian date
 * @param locale - Language for month name ('ar' | 'en')
 * @returns Formatted date string
 *
 * @example
 * formatGregorianDate(new Date('2025-10-31'), 'en')
 * // Returns: "October 31, 2025"
 */
export function formatGregorianDate(date: Date, locale: 'ar' | 'en' = 'en'): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  return date.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', options);
}

/**
 * Get both Gregorian and Hijri formatted dates
 *
 * @param date - Date to format
 * @param locale - Language for month names
 * @returns Object with both Gregorian and Hijri formatted strings
 *
 * @example
 * const { gregorian, hijri } = formatBothCalendars(new Date(), 'en');
 * // gregorian: "October 31, 2025"
 * // hijri: "29 Rabi al-Thani 1447 AH"
 */
export function formatBothCalendars(
  date: Date = new Date(),
  locale: 'ar' | 'en' = 'en'
): { gregorian: string; hijri: string } {
  const hijriDate = gregorianToHijri(date);

  return {
    gregorian: formatGregorianDate(date, locale),
    hijri: formatHijriDate(hijriDate, locale),
  };
}

/**
 * Check if a given Hijri month is Ramadan
 *
 * @param date - Gregorian date to check
 * @returns True if the date falls in Ramadan
 */
export function isRamadan(date: Date = new Date()): boolean {
  const hijri = gregorianToHijri(date);
  return hijri.month === 9; // Ramadan is the 9th month
}

/**
 * Check if a given Hijri date is in the sacred months
 * Sacred months: Muharram (1), Rajab (7), Dhul-Qadah (11), Dhul-Hijjah (12)
 *
 * @param date - Gregorian date to check
 * @returns True if the date falls in a sacred month
 */
export function isSacredMonth(date: Date = new Date()): boolean {
  const hijri = gregorianToHijri(date);
  return [1, 7, 11, 12].includes(hijri.month);
}
