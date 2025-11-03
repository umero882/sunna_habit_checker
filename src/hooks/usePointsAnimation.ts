/**
 * Points Animation Hook
 * Provides animated counter for reward points display
 */

import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

interface UsePointsAnimationOptions {
  /** Starting value */
  from: number;
  /** Ending value */
  to: number;
  /** Animation duration in milliseconds */
  duration: number;
  /** Whether to start animation immediately */
  autoStart?: boolean;
}

interface UsePointsAnimationReturn {
  /** Animated value for the counter */
  animatedValue: Animated.Value;
  /** Start the animation */
  start: () => void;
  /** Reset animation to initial value */
  reset: () => void;
}

/**
 * Hook for animating number counting (e.g., 1 → 27)
 * Uses React Native Animated API with easing
 *
 * @example
 * const { animatedValue, start } = usePointsAnimation({
 *   from: 1,
 *   to: 27,
 *   duration: 1500,
 * });
 *
 * // In component
 * <Animated.Text>{animatedValue.interpolate({
 *   inputRange: [1, 27],
 *   outputRange: ['1', '27'],
 * })}</Animated.Text>
 */
export const usePointsAnimation = ({
  from,
  to,
  duration,
  autoStart = false,
}: UsePointsAnimationOptions): UsePointsAnimationReturn => {
  const animatedValue = useRef(new Animated.Value(from)).current;

  const start = () => {
    // Reset to starting value
    animatedValue.setValue(from);

    // Animate to ending value
    Animated.timing(animatedValue, {
      toValue: to,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // Can't use native driver for text values
    }).start();
  };

  const reset = () => {
    animatedValue.setValue(from);
  };

  // Auto-start if requested
  useEffect(() => {
    if (autoStart) {
      start();
    }
  }, [autoStart]);

  return {
    animatedValue,
    start,
    reset,
  };
};

/**
 * Hook for scale/bounce animation (for celebration effects)
 */
export const useScaleAnimation = (duration: number = 300): UsePointsAnimationReturn => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  const start = () => {
    animatedValue.setValue(0);

    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1.2,
        duration: duration / 2,
        easing: Easing.out(Easing.back(2)),
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: duration / 2,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const reset = () => {
    animatedValue.setValue(0);
  };

  return {
    animatedValue,
    start,
    reset,
  };
};

/**
 * Hook for fade-in animation
 */
export const useFadeAnimation = (duration: number = 300): UsePointsAnimationReturn => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  const start = () => {
    animatedValue.setValue(0);

    Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const reset = () => {
    animatedValue.setValue(0);
  };

  return {
    animatedValue,
    start,
    reset,
  };
};
