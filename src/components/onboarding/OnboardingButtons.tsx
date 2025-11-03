/**
 * Onboarding Navigation Buttons Component
 * Skip, Back, Next, and Get Started buttons for onboarding flow
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

export interface OnboardingButtonsProps {
  // Flags
  showBack?: boolean;
  showSkip?: boolean;
  showNext?: boolean;
  isLastStep?: boolean;

  // Button labels
  nextLabel?: string;
  skipLabel?: string;
  backLabel?: string;
  completeLabel?: string;

  // Callbacks
  onNext?: () => void;
  onSkip?: () => void;
  onBack?: () => void;

  // Loading state
  isLoading?: boolean;

  // Style variant
  variant?: 'light' | 'dark'; // light buttons on dark bg, dark buttons on light bg
}

export const OnboardingButtons: React.FC<OnboardingButtonsProps> = ({
  showBack = true,
  showSkip = true,
  showNext = true,
  isLastStep = false,
  nextLabel = 'Next',
  skipLabel = 'Skip',
  backLabel = 'Back',
  completeLabel = 'Get Started',
  onNext,
  onSkip,
  onBack,
  isLoading = false,
  variant = 'light',
}) => {
  const isDark = variant === 'dark';

  const textColor = isDark ? theme.colors.text.primary : theme.colors.white;
  const borderColor = isDark ? theme.colors.border.light : 'rgba(255, 255, 255, 0.3)';
  // Swap colors for better contrast: green button with white text on colored backgrounds
  const primaryButtonBg = isDark ? theme.colors.primary[600] : theme.colors.primary[700];
  const primaryButtonText = theme.colors.white; // Always white text for good contrast

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <View style={styles.container}>
        {/* Main Row: Back and Next buttons side by side */}
        <View style={styles.buttonRow}>
          {/* Back Button */}
          {showBack && onBack ? (
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor }]}
              onPress={onBack}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <Ionicons
                name="arrow-back"
                size={20}
                color={textColor}
                style={styles.backIcon}
              />
              <Text style={[styles.secondaryButtonText, { color: textColor }]}>
                {backLabel}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flex: 0.4 }} />
          )}

          {/* Next/Complete Button */}
          {showNext && onNext && (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: primaryButtonBg, flex: 1 }]}
              onPress={onNext}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator
                  size="small"
                  color={primaryButtonText}
                />
              ) : (
                <>
                  <Text style={[styles.primaryButtonText, { color: primaryButtonText }]}>
                    {isLastStep ? completeLabel : nextLabel}
                  </Text>
                  {!isLastStep && (
                    <Ionicons
                      name="arrow-forward"
                      size={20}
                      color={primaryButtonText}
                      style={styles.nextIcon}
                    />
                  )}
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'transparent',
  },
  container: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    paddingTop: theme.spacing.md,
    backgroundColor: 'transparent',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  // Primary Button (Next/Get Started)
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md + 4,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.xs,
    minHeight: 56,
    ...theme.shadows.lg,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: 0.3,
  },
  nextIcon: {
    marginLeft: theme.spacing.xs,
  },
  // Secondary Button (Back)
  secondaryButton: {
    flex: 0.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md + 2,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    gap: theme.spacing.xs,
    minHeight: 56,
  },
  secondaryButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  backIcon: {
    marginRight: theme.spacing.xs,
  },
});

export default OnboardingButtons;
