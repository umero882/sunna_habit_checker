/**
 * Analytics Service
 * Track user events and onboarding funnel
 */

import { OnboardingStep } from './onboarding';

import { createLogger } from '../utils/logger';

const logger = createLogger('analytics');

// Analytics event names
export const ANALYTICS_EVENTS = {
  // Onboarding Events
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_STEP_VIEWED: 'onboarding_step_viewed',
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',
  ONBOARDING_STEP_SKIPPED: 'onboarding_step_skipped',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_ABANDONED: 'onboarding_abandoned',

  // Permission Events
  PERMISSION_REQUESTED: 'permission_requested',
  PERMISSION_GRANTED: 'permission_granted',
  PERMISSION_DENIED: 'permission_denied',

  // Settings Events
  PRAYER_SETTINGS_CHANGED: 'prayer_settings_changed',
  QURAN_PREFERENCES_CHANGED: 'quran_preferences_changed',

  // User Actions
  FIRST_PRAYER_LOGGED: 'first_prayer_logged',
  FIRST_QURAN_READ: 'first_quran_read',
  FIRST_HABIT_COMPLETED: 'first_habit_completed',
} as const;

export type AnalyticsEvent = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];

interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Track an analytics event
 * Currently logs to console. Integrate with your analytics provider (e.g., Firebase, Mixpanel)
 */
export const trackEvent = (eventName: AnalyticsEvent, properties?: EventProperties): void => {
  // Log to console for development
  if (__DEV__) {
    logger.debug('[Analytics]', eventName, properties);
  }

  // TODO: Integrate with analytics provider
  // Examples:

  // Firebase Analytics
  // import analytics from '@react-native-firebase/analytics';
  // analytics().logEvent(eventName, properties);

  // Mixpanel
  // import { Mixpanel } from 'mixpanel-react-native';
  // Mixpanel.track(eventName, properties);

  // Amplitude
  // import { Amplitude } from '@amplitude/react-native';
  // Amplitude.logEvent(eventName, properties);

  // Segment
  // import analytics from '@segment/analytics-react-native';
  // analytics.track(eventName, properties);
};

/**
 * Track onboarding step view
 */
export const trackOnboardingStepViewed = (step: OnboardingStep, stepIndex: number): void => {
  trackEvent(ANALYTICS_EVENTS.ONBOARDING_STEP_VIEWED, {
    step,
    step_index: stepIndex,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track onboarding step completion
 */
export const trackOnboardingStepCompleted = (step: OnboardingStep, stepIndex: number, timeSpent?: number): void => {
  trackEvent(ANALYTICS_EVENTS.ONBOARDING_STEP_COMPLETED, {
    step,
    step_index: stepIndex,
    time_spent_seconds: timeSpent,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track onboarding step skipped
 */
export const trackOnboardingStepSkipped = (step: OnboardingStep, stepIndex: number): void => {
  trackEvent(ANALYTICS_EVENTS.ONBOARDING_STEP_SKIPPED, {
    step,
    step_index: stepIndex,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track onboarding started
 */
export const trackOnboardingStarted = (): void => {
  trackEvent(ANALYTICS_EVENTS.ONBOARDING_STARTED, {
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track onboarding completed
 */
export const trackOnboardingCompleted = (totalTimeSeconds?: number): void => {
  trackEvent(ANALYTICS_EVENTS.ONBOARDING_COMPLETED, {
    total_time_seconds: totalTimeSeconds,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track onboarding abandoned
 */
export const trackOnboardingAbandoned = (lastStep: OnboardingStep, lastStepIndex: number): void => {
  trackEvent(ANALYTICS_EVENTS.ONBOARDING_ABANDONED, {
    last_step: lastStep,
    last_step_index: lastStepIndex,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track permission request
 */
export const trackPermissionRequested = (permission: 'location' | 'notifications'): void => {
  trackEvent(ANALYTICS_EVENTS.PERMISSION_REQUESTED, {
    permission,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track permission granted
 */
export const trackPermissionGranted = (permission: 'location' | 'notifications'): void => {
  trackEvent(ANALYTICS_EVENTS.PERMISSION_GRANTED, {
    permission,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track permission denied
 */
export const trackPermissionDenied = (permission: 'location' | 'notifications'): void => {
  trackEvent(ANALYTICS_EVENTS.PERMISSION_DENIED, {
    permission,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track prayer settings change
 */
export const trackPrayerSettingsChanged = (calcMethod: string, madhhab: string): void => {
  trackEvent(ANALYTICS_EVENTS.PRAYER_SETTINGS_CHANGED, {
    calculation_method: calcMethod,
    madhhab,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track Quran preferences change
 */
export const trackQuranPreferencesChanged = (reciter: string, dailyGoal: number): void => {
  trackEvent(ANALYTICS_EVENTS.QURAN_PREFERENCES_CHANGED, {
    reciter,
    daily_goal_pages: dailyGoal,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Set user properties (identify user)
 */
export const setUserProperties = (properties: EventProperties): void => {
  if (__DEV__) {
    logger.debug('[Analytics] User Properties:', properties);
  }

  // TODO: Set user properties in your analytics provider
  // Firebase Analytics
  // analytics().setUserProperties(properties);

  // Mixpanel
  // Mixpanel.getPeople().set(properties);

  // Amplitude
  // Amplitude.identify(new Identify().set(properties));
};

/**
 * Set user ID
 */
export const setUserId = (userId: string): void => {
  if (__DEV__) {
    logger.debug('[Analytics] User ID:', userId);
  }

  // TODO: Set user ID in your analytics provider
  // Firebase Analytics
  // analytics().setUserId(userId);

  // Mixpanel
  // Mixpanel.identify(userId);

  // Amplitude
  // Amplitude.setUserId(userId);
};

export default {
  trackEvent,
  trackOnboardingStepViewed,
  trackOnboardingStepCompleted,
  trackOnboardingStepSkipped,
  trackOnboardingStarted,
  trackOnboardingCompleted,
  trackOnboardingAbandoned,
  trackPermissionRequested,
  trackPermissionGranted,
  trackPermissionDenied,
  trackPrayerSettingsChanged,
  trackQuranPreferencesChanged,
  setUserProperties,
  setUserId,
  ANALYTICS_EVENTS,
};
