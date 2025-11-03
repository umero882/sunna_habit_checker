/**
 * useGreeting Hook
 * Returns time-appropriate greeting based on current hour
 */

import { useState, useEffect } from 'react';

export type GreetingType = 'morning' | 'afternoon' | 'evening' | 'night';

export interface GreetingData {
  greeting: string;
  greetingAr: string;
  type: GreetingType;
  icon: string;
}

/**
 * Get greeting based on current hour
 *
 * @param hour - Hour of the day (0-23)
 * @param locale - Language for greeting
 * @returns Greeting data
 */
function getGreetingForHour(hour: number, locale: 'en' | 'ar' = 'en'): GreetingData {
  // Morning: 4 AM - 11:59 AM
  if (hour >= 4 && hour < 12) {
    return {
      greeting: 'Good Morning',
      greetingAr: 'صباح الخير',
      type: 'morning',
      icon: '🌅',
    };
  }

  // Afternoon: 12 PM - 4:59 PM
  if (hour >= 12 && hour < 17) {
    return {
      greeting: 'Good Afternoon',
      greetingAr: 'مساء الخير',
      type: 'afternoon',
      icon: '☀️',
    };
  }

  // Evening: 5 PM - 8:59 PM
  if (hour >= 17 && hour < 21) {
    return {
      greeting: 'Good Evening',
      greetingAr: 'مساء الخير',
      type: 'evening',
      icon: '🌆',
    };
  }

  // Night: 9 PM - 3:59 AM
  return {
    greeting: 'Good Night',
    greetingAr: 'ليلة سعيدة',
    type: 'night',
    icon: '🌙',
  };
}

/**
 * Hook to get time-based greeting that updates automatically
 *
 * @param locale - Language for greeting ('en' | 'ar')
 * @param updateInterval - How often to check for greeting changes (ms), default 60000 (1 minute)
 * @returns Greeting data
 *
 * @example
 * const { greeting, greetingAr, type, icon } = useGreeting('en');
 * // Returns: { greeting: "Good Morning", greetingAr: "صباح الخير", type: "morning", icon: "🌅" }
 */
export function useGreeting(
  locale: 'en' | 'ar' = 'en',
  updateInterval: number = 60000
): GreetingData {
  const [greetingData, setGreetingData] = useState<GreetingData>(() => {
    const now = new Date();
    return getGreetingForHour(now.getHours(), locale);
  });

  useEffect(() => {
    // Update greeting based on current time
    const updateGreeting = () => {
      const now = new Date();
      const newGreeting = getGreetingForHour(now.getHours(), locale);

      // Only update state if greeting actually changed (prevents unnecessary re-renders)
      setGreetingData(prev => {
        if (prev.type !== newGreeting.type) {
          return newGreeting;
        }
        return prev;
      });
    };

    // Set up interval to check for greeting changes
    const interval = setInterval(updateGreeting, updateInterval);

    return () => clearInterval(interval);
  }, [locale, updateInterval]);

  return greetingData;
}

/**
 * Hook to get Islamic greeting (Assalamu Alaikum) with time-based variant
 *
 * @param locale - Language for greeting
 * @returns Islamic greeting
 *
 * @example
 * const greeting = useIslamicGreeting('en');
 * // Returns: "السلام عليكم - Peace be upon you"
 */
export function useIslamicGreeting(locale: 'en' | 'ar' = 'en'): string {
  const { type } = useGreeting(locale);

  if (locale === 'ar') {
    return 'السلام عليكم';
  }

  // English with transliteration
  return 'Assalāmu ʿalaykum';
}
