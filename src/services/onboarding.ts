/**
 * Onboarding Service
 * Manages onboarding state and progress tracking
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { createLogger } from '../utils/logger';

const logger = createLogger('onboarding');

// AsyncStorage keys for onboarding
export const ONBOARDING_KEYS = {
  COMPLETED: '@onboarding_completed',
  CURRENT_STEP: '@onboarding_current_step',
  SKIPPED_STEPS: '@onboarding_skipped_steps',
  TIMESTAMP: '@onboarding_timestamp',
} as const;

// Onboarding step identifiers
export type OnboardingStep =
  | 'welcome'
  | 'features_prayer'
  | 'features_quran'
  | 'features_sunnah'
  | 'permissions'
  | 'prayer_settings'
  | 'quran_preferences'
  | 'completion';

export interface OnboardingState {
  completed: boolean;
  currentStep: OnboardingStep;
  skippedSteps: OnboardingStep[];
  timestamp?: string;
}

/**
 * Check if onboarding has been completed
 */
export const isOnboardingComplete = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEYS.COMPLETED);
    return value === 'true';
  } catch (error) {
    logger.error('Error checking onboarding status:', error);
    return false;
  }
};

/**
 * Mark onboarding as completed
 */
export const completeOnboarding = async (): Promise<void> => {
  try {
    const timestamp = new Date().toISOString();
    await AsyncStorage.multiSet([
      [ONBOARDING_KEYS.COMPLETED, 'true'],
      [ONBOARDING_KEYS.TIMESTAMP, timestamp],
    ]);
  } catch (error) {
    logger.error('Error completing onboarding:', error);
    throw error;
  }
};

/**
 * Save current onboarding step
 */
export const saveOnboardingStep = async (step: OnboardingStep): Promise<void> => {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEYS.CURRENT_STEP, step);
  } catch (error) {
    logger.error('Error saving onboarding step:', error);
  }
};

/**
 * Get current onboarding step
 */
export const getCurrentOnboardingStep = async (): Promise<OnboardingStep | null> => {
  try {
    const step = await AsyncStorage.getItem(ONBOARDING_KEYS.CURRENT_STEP);
    return (step as OnboardingStep) || null;
  } catch (error) {
    logger.error('Error getting onboarding step:', error);
    return null;
  }
};

/**
 * Mark a step as skipped
 */
export const skipOnboardingStep = async (step: OnboardingStep): Promise<void> => {
  try {
    const skippedStepsStr = await AsyncStorage.getItem(ONBOARDING_KEYS.SKIPPED_STEPS);
    const skippedSteps: OnboardingStep[] = skippedStepsStr ? JSON.parse(skippedStepsStr) : [];

    if (!skippedSteps.includes(step)) {
      skippedSteps.push(step);
      await AsyncStorage.setItem(ONBOARDING_KEYS.SKIPPED_STEPS, JSON.stringify(skippedSteps));
    }
  } catch (error) {
    logger.error('Error skipping onboarding step:', error);
  }
};

/**
 * Get all skipped steps
 */
export const getSkippedSteps = async (): Promise<OnboardingStep[]> => {
  try {
    const skippedStepsStr = await AsyncStorage.getItem(ONBOARDING_KEYS.SKIPPED_STEPS);
    return skippedStepsStr ? JSON.parse(skippedStepsStr) : [];
  } catch (error) {
    logger.error('Error getting skipped steps:', error);
    return [];
  }
};

/**
 * Get full onboarding state
 */
export const getOnboardingState = async (): Promise<OnboardingState> => {
  try {
    const [completed, currentStep, skippedSteps, timestamp] = await AsyncStorage.multiGet([
      ONBOARDING_KEYS.COMPLETED,
      ONBOARDING_KEYS.CURRENT_STEP,
      ONBOARDING_KEYS.SKIPPED_STEPS,
      ONBOARDING_KEYS.TIMESTAMP,
    ]);

    return {
      completed: completed[1] === 'true',
      currentStep: (currentStep[1] as OnboardingStep) || 'welcome',
      skippedSteps: skippedSteps[1] ? JSON.parse(skippedSteps[1]) : [],
      timestamp: timestamp[1] || undefined,
    };
  } catch (error) {
    logger.error('Error getting onboarding state:', error);
    return {
      completed: false,
      currentStep: 'welcome',
      skippedSteps: [],
    };
  }
};

/**
 * Reset onboarding (for testing or re-onboarding)
 */
export const resetOnboarding = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      ONBOARDING_KEYS.COMPLETED,
      ONBOARDING_KEYS.CURRENT_STEP,
      ONBOARDING_KEYS.SKIPPED_STEPS,
      ONBOARDING_KEYS.TIMESTAMP,
    ]);
  } catch (error) {
    logger.error('Error resetting onboarding:', error);
    throw error;
  }
};

/**
 * Get onboarding completion timestamp
 */
export const getOnboardingTimestamp = async (): Promise<string | null> => {
  try {
    const timestamp = await AsyncStorage.getItem(ONBOARDING_KEYS.TIMESTAMP);
    return timestamp;
  } catch (error) {
    logger.error('Error getting onboarding timestamp:', error);
    return null;
  }
};
