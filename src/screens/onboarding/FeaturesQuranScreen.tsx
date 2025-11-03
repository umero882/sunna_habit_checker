/**
 * Features Quran Screen (Onboarding Step 3)
 * Highlight Quran reading features
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingSlide, OnboardingButtons, ProgressIndicator } from '../../components/onboarding';
import { useOnboarding } from '../../hooks/useOnboarding';
import { theme } from '../../constants/theme';

export const FeaturesQuranScreen: React.FC = () => {
  const { t } = useTranslation();
  const { goToNextStep, goToPreviousStep, skipCurrentStep, currentStepIndex, totalSteps } =
    useOnboarding();

  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(156, 39, 176, 0.95)' }}>
      <OnboardingSlide
        title={t('onboarding.quran.title', 'Connect with the Quran Daily')}
        description={t(
          'onboarding.quran.description',
          'Read, listen, and track your Quran progress with beautiful recitation'
        )}
        icon={
          <View style={styles.iconCircle}>
            <Ionicons name="book" size={72} color={theme.colors.white} />
          </View>
        }
        gradientColors={['rgba(156, 39, 176, 0.95)', 'rgba(156, 39, 176, 0.85)']}
        showSkip={true}
        onSkip={skipCurrentStep}
        skipLabel={t('common.skip', 'Skip')}
      >
        <View style={styles.featureList}>
          <FeatureItem
            icon="musical-notes"
            text={t('onboarding.quran.feature1', 'Audio recitation with word highlighting')}
          />
          <FeatureItem
            icon="list"
            text={t('onboarding.quran.feature2', 'Reading plans (Juz, Khatma)')}
          />
          <FeatureItem
            icon="bookmark"
            text={t('onboarding.quran.feature3', 'Bookmarks and progress tracking')}
          />
          <FeatureItem
            icon="globe"
            text={t('onboarding.quran.feature4', 'Multiple translations & reciters')}
          />
        </View>
      </OnboardingSlide>

      <ProgressIndicator totalSteps={totalSteps} currentStep={currentStepIndex} />

      <OnboardingButtons
        showBack={true}
        showSkip={false}
        onNext={goToNextStep}
        onBack={goToPreviousStep}
      />
    </View>
  );
};

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

export default FeaturesQuranScreen;
