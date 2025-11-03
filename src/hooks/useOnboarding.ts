/**
 * Onboarding Hook
 * Manages onboarding state and navigation flow
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { OnboardingStackParamList } from '../types';
import {
  isOnboardingComplete,
  completeOnboarding,
  saveOnboardingStep,
  getCurrentOnboardingStep,
  skipOnboardingStep,
  getOnboardingState,
  resetOnboarding as resetOnboardingService,
  type OnboardingStep,
  type OnboardingState,
} from '../services/onboarding';
import {
  trackOnboardingStarted,
  trackOnboardingStepViewed,
  trackOnboardingStepCompleted,
  trackOnboardingStepSkipped,
  trackOnboardingCompleted,
} from '../services/analytics';
import { createLogger } from '../utils/logger';

const logger = createLogger('useOnboarding');

// Define the order of onboarding screens
const ONBOARDING_FLOW: OnboardingStep[] = [
  'welcome',
  'features_prayer',
  'features_quran',
  'features_sunnah',
  'permissions',
  'prayer_settings',
  'quran_preferences',
  'completion',
];

// Map steps to screen names
const STEP_TO_SCREEN: Record<OnboardingStep, keyof OnboardingStackParamList> = {
  welcome: 'Welcome',
  features_prayer: 'FeaturesPrayer',
  features_quran: 'FeaturesQuran',
  features_sunnah: 'FeaturesSunnah',
  permissions: 'Permissions',
  prayer_settings: 'PrayerSettings',
  quran_preferences: 'QuranPreferences',
  completion: 'Complete',
};

export interface UseOnboardingReturn {
  // State
  currentStep: OnboardingStep;
  totalSteps: number;
  currentStepIndex: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  progress: number;
  isLoading: boolean;

  // Navigation
  goToNextStep: () => Promise<void>;
  goToPreviousStep: () => void;
  skipCurrentStep: () => Promise<void>;
  goToStep: (step: OnboardingStep) => void;
  completeOnboarding: () => Promise<void>;

  // State management
  state: OnboardingState | null;
  refreshState: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

export const useOnboarding = (): UseOnboardingReturn => {
  const navigation = useNavigation<StackNavigationProp<OnboardingStackParamList>>();

  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [state, setState] = useState<OnboardingState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const stepStartTimeRef = useRef<number>(Date.now());
  const onboardingStartTimeRef = useRef<number>(Date.now());

  // Calculate progress metrics
  const currentStepIndex = ONBOARDING_FLOW.indexOf(currentStep);
  const totalSteps = ONBOARDING_FLOW.length;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  // Load onboarding state on mount
  useEffect(() => {
    const loadState = async () => {
      setIsLoading(true);
      try {
        const onboardingState = await getOnboardingState();
        setState(onboardingState);
        setCurrentStep(onboardingState.currentStep);

        // Track onboarding start if just beginning
        if (!onboardingState.completed && onboardingState.currentStep === 'welcome') {
          trackOnboardingStarted();
          onboardingStartTimeRef.current = Date.now();
        }
      } catch (error) {
        logger.error('Error loading onboarding state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadState();
  }, []);

  // Track step views
  useEffect(() => {
    if (!isLoading && currentStep) {
      trackOnboardingStepViewed(currentStep, currentStepIndex);
      stepStartTimeRef.current = Date.now();
    }
  }, [currentStep, currentStepIndex, isLoading]);

  // Refresh state from storage
  const refreshState = useCallback(async () => {
    try {
      const onboardingState = await getOnboardingState();
      setState(onboardingState);
      setCurrentStep(onboardingState.currentStep);
    } catch (error) {
      logger.error('Error refreshing onboarding state:', error);
    }
  }, []);

  // Navigate to next step
  const goToNextStep = useCallback(async () => {
    // Track step completion with time spent
    const timeSpent = Math.floor((Date.now() - stepStartTimeRef.current) / 1000);
    trackOnboardingStepCompleted(currentStep, currentStepIndex, timeSpent);

    const nextIndex = currentStepIndex + 1;

    if (nextIndex >= totalSteps) {
      // Onboarding complete
      await completeOnboarding();
      return;
    }

    const nextStep = ONBOARDING_FLOW[nextIndex];
    const screenName = STEP_TO_SCREEN[nextStep];

    // Save progress
    await saveOnboardingStep(nextStep);
    setCurrentStep(nextStep);

    // Navigate to screen
    navigation.navigate(screenName);
  }, [currentStepIndex, totalSteps, navigation, currentStep]);

  // Navigate to previous step
  const goToPreviousStep = useCallback(() => {
    if (isFirstStep) return;

    const previousIndex = currentStepIndex - 1;
    const previousStep = ONBOARDING_FLOW[previousIndex];
    const screenName = STEP_TO_SCREEN[previousStep];

    setCurrentStep(previousStep);
    navigation.navigate(screenName);
  }, [currentStepIndex, isFirstStep, navigation]);

  // Skip current step
  const skipCurrentStep = useCallback(async () => {
    // Track skip event
    trackOnboardingStepSkipped(currentStep, currentStepIndex);

    await skipOnboardingStep(currentStep);
    await goToNextStep();
  }, [currentStep, currentStepIndex, goToNextStep]);

  // Go to specific step
  const goToStep = useCallback(
    (step: OnboardingStep) => {
      const screenName = STEP_TO_SCREEN[step];
      setCurrentStep(step);
      navigation.navigate(screenName);
    },
    [navigation]
  );

  // Complete onboarding and exit
  const complete = useCallback(async () => {
    try {
      // Track completion with total time
      const totalTime = Math.floor((Date.now() - onboardingStartTimeRef.current) / 1000);
      trackOnboardingCompleted(totalTime);

      await completeOnboarding();
      // Navigation will be handled by RootNavigator listening to auth state
    } catch (error) {
      logger.error('Error completing onboarding:', error);
      throw error;
    }
  }, []);

  // Reset onboarding
  const resetOnboarding = useCallback(async () => {
    try {
      await resetOnboardingService();
      setCurrentStep('welcome');
      setState(null);
      navigation.navigate('Welcome');
    } catch (error) {
      logger.error('Error resetting onboarding:', error);
      throw error;
    }
  }, [navigation]);

  return {
    // State
    currentStep,
    totalSteps,
    currentStepIndex,
    isFirstStep,
    isLastStep,
    progress,
    isLoading,

    // Navigation
    goToNextStep,
    goToPreviousStep,
    skipCurrentStep,
    goToStep,
    completeOnboarding: complete,

    // State management
    state,
    refreshState,
    resetOnboarding,
  };
};

export default useOnboarding;
