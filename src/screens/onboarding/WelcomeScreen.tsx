/**
 * Welcome Screen (Onboarding Step 1)
 * Personalized greeting and journey introduction
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingSlide, OnboardingButtons, ProgressIndicator } from '../../components/onboarding';
import { useOnboarding } from '../../hooks/useOnboarding';
import { useProfile } from '../../hooks/useProfile';
import { theme } from '../../constants/theme';

export const WelcomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const { goToNextStep, currentStepIndex, totalSteps } = useOnboarding();
  const { getDisplayName } = useProfile();

  const displayName = getDisplayName();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.primary[600] }}>
      <OnboardingSlide
        title={t('onboarding.welcome.title', { name: displayName })}
        description={t('onboarding.welcome.description')}
        icon={
          <View style={styles.iconCircle}>
            <Ionicons name="hand-right" size={64} color={theme.colors.white} />
          </View>
        }
      >
        {/* Feature Preview Cards */}
        <View style={styles.featureCards}>
          <View style={styles.featureCard}>
            <Ionicons name="time-outline" size={32} color={theme.colors.white} />
            <Text style={styles.featureText}>
              {t('onboarding.welcome.feature1', 'Track Prayers')}
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Ionicons name="book-outline" size={32} color={theme.colors.white} />
            <Text style={styles.featureText}>{t('onboarding.welcome.feature2', 'Read Quran')}</Text>
          </View>

          <View style={styles.featureCard}>
            <Ionicons name="checkmark-circle-outline" size={32} color={theme.colors.white} />
            <Text style={styles.featureText}>
              {t('onboarding.welcome.feature3', 'Build Habits')}
            </Text>
          </View>
        </View>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          {t('onboarding.welcome.subtitle', "Let's set up your spiritual journey")}
        </Text>
      </OnboardingSlide>

      {/* Progress Indicator */}
      <ProgressIndicator totalSteps={totalSteps} currentStep={currentStepIndex} />

      {/* Navigation Buttons */}
      <OnboardingButtons
        showBack={false}
        showSkip={false}
        onNext={goToNextStep}
        nextLabel={t('onboarding.welcome.next', "Let's Begin")}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.lg,
  },
  featureCards: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl,
  },
  featureCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...theme.shadows.md,
  },
  featureText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeight.semibold,
    textAlign: 'center',
    lineHeight: 18,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.white,
    textAlign: 'center',
    marginTop: theme.spacing.xl * 1.5,
    opacity: 0.95,
    fontWeight: theme.typography.fontWeight.medium,
    letterSpacing: 0.3,
  },
});

export default WelcomeScreen;
