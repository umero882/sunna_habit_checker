/**
 * Progress Indicator Component
 * Dot indicators showing current onboarding step with smooth animations
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { theme } from '../../constants/theme';

export interface ProgressIndicatorProps {
  totalSteps: number;
  currentStep: number;
  dotColor?: string;
  activeDotColor?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  totalSteps,
  currentStep,
  dotColor = 'rgba(255, 255, 255, 0.4)',
  activeDotColor = theme.colors.white,
}) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <ProgressDot
          key={index}
          isActive={index === currentStep}
          dotColor={dotColor}
          activeDotColor={activeDotColor}
        />
      ))}
    </View>
  );
};

const ProgressDot: React.FC<{
  isActive: boolean;
  dotColor: string;
  activeDotColor: string;
}> = ({ isActive, dotColor, activeDotColor }) => {
  const scaleAnim = useRef(new Animated.Value(isActive ? 1.2 : 1)).current;
  const opacityAnim = useRef(new Animated.Value(isActive ? 1 : 0.6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isActive ? 1.2 : 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: isActive ? 1 : 0.6,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isActive]);

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          backgroundColor: isActive ? activeDotColor : dotColor,
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.lg,
    backgroundColor: 'transparent',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default ProgressIndicator;
