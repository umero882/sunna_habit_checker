/**
 * Features Prayer Screen (Onboarding Step 2)
 * Highlight prayer tracking features
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingSlide, OnboardingButtons, ProgressIndicator } from '../../components/onboarding';
import { useOnboarding } from '../../hooks/useOnboarding';
import { theme } from '../../constants/theme';

export const FeaturesPrayerScreen: React.FC = () => {
  const { t } = useTranslation();
  const { goToNextStep, goToPreviousStep, currentStepIndex, totalSteps } = useOnboarding();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.info }}>
      <OnboardingSlide
        title={t('onboarding.prayer.title', 'Never Miss a Prayer')}
        description={t(
          'onboarding.prayer.description',
          'Track your 5 daily prayers with accurate times based on your location'
        )}
        icon={
          <View style={styles.iconCircle}>
            <Ionicons name="time" size={72} color={theme.colors.white} />
          </View>
        }
        gradientColors={['rgba(33, 150, 243, 0.95)', 'rgba(33, 150, 243, 0.85)']}
        showSkip={true}
        onSkip={goToNextStep}
        skipLabel={t('common.skip', 'Skip')}
      >
        {/* Feature List */}
        <View style={styles.featureList}>
          <FeatureItem
            icon="checkmark-done"
            text={t('onboarding.prayer.feature1', 'On-time, delayed, and missed tracking')}
          />
          <FeatureItem
            icon="people"
            text={t('onboarding.prayer.feature2', 'Jamaah (congregation) prayers')}
          />
          <FeatureItem
            icon="flame"
            text={t('onboarding.prayer.feature3', 'Prayer streaks and calendar')}
          />
          <FeatureItem
            icon="notifications"
            text={t('onboarding.prayer.feature4', 'Smart prayer reminders')}
          />
        </View>
      </OnboardingSlide>

      {/* Progress Indicator */}
      <ProgressIndicator totalSteps={totalSteps} currentStep={currentStepIndex} />

      {/* Navigation Buttons */}
      <OnboardingButtons
        showBack={true}
        showSkip={false}
        onNext={goToNextStep}
        onBack={goToPreviousStep}
      />
    </View>
  );
};

// Helper component for feature items
const FeatureItem: React.FC<{ icon: string; text: string }> = ({ icon, text }) => (
  <View style={styles.featureItem}>
    <Ionicons name={icon as any} size={24} color={theme.colors.white} />
    <Text style={styles.featureItemText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.lg,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  featureList: {
    marginTop: theme.spacing.xl * 1.5,
    gap: theme.spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    ...theme.shadows.sm,
  },
  featureItemText: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeight.semibold,
    lineHeight: 22,
  },
});

export default FeaturesPrayerScreen;
