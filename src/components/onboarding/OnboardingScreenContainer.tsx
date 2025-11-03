/**
 * Onboarding Screen Container
 * Wrapper component that handles proper layout for all onboarding screens
 * Ensures gradient extends full height with proper safe area handling
 */

import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';

export interface OnboardingScreenContainerProps {
  children: ReactNode;
  gradientColors?: readonly [string, string, ...string[]];
}

export const OnboardingScreenContainer: React.FC<OnboardingScreenContainerProps> = ({
  children,
  gradientColors = [
    'rgba(76, 175, 80, 0.95)',
    'rgba(76, 175, 80, 0.85)',
    'rgba(76, 175, 80, 0.75)',
  ] as const,
}) => {
  return (
    <View style={styles.container}>
      {/* Gradient Overlay - extends full screen */}
      <LinearGradient
        colors={gradientColors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Content */}
      <View style={styles.contentWrapper}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary[600],
  },
  contentWrapper: {
    flex: 1,
  },
});

export default OnboardingScreenContainer;
