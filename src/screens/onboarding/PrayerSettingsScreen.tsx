/**
 * Prayer Settings Screen (Onboarding Step 6)
 * Configure prayer calculation method and madhhab
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingSlide, OnboardingButtons, ProgressIndicator } from '../../components/onboarding';
import { useOnboarding } from '../../hooks/useOnboarding';
import { useUserSettings } from '../../hooks/useUserSettings';
import { trackPrayerSettingsChanged } from '../../services/analytics';
import type { Madhhab } from '../../types';
import { theme } from '../../constants/theme';

const CALCULATION_METHODS = [
  { id: 'MWL', name: 'Muslim World League' },
  { id: 'ISNA', name: 'Islamic Society of North America' },
  { id: 'Egypt', name: 'Egyptian General Authority of Survey' },
  { id: 'Makkah', name: 'Umm al-Qura University, Makkah' },
  { id: 'Karachi', name: 'University of Islamic Sciences, Karachi' },
];

const MADHHAB_OPTIONS: { id: Madhhab; name: string; description: string }[] = [
  { id: 'Standard', name: 'Standard (Shafi, Maliki, Hanbali)', description: 'Earlier Asr time' },
  { id: 'Hanafi', name: 'Hanafi', description: 'Later Asr time' },
];

export const PrayerSettingsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { goToNextStep, goToPreviousStep, skipCurrentStep, currentStepIndex, totalSteps } =
    useOnboarding();
  const { settings, updateSettings } = useUserSettings();

  const [selectedMethod, setSelectedMethod] = useState(settings?.prayerCalcMethod || 'MWL');
  const [selectedMadhhab, setSelectedMadhhab] = useState<Madhhab>(settings?.madhhab || 'Standard');

  const handleNext = async () => {
    // Track settings change
    trackPrayerSettingsChanged(selectedMethod, selectedMadhhab);

    await updateSettings({
      prayerCalcMethod: selectedMethod,
      madhhab: selectedMadhhab,
    });
    goToNextStep();
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(33, 150, 243, 0.92)' }}>
      <OnboardingSlide
        title={t('onboarding.prayerSettings.title', 'Prayer Time Settings')}
        description={t(
          'onboarding.prayerSettings.description',
          'Choose your calculation method and madhab for accurate prayer times'
        )}
        scrollable
        gradientColors={['rgba(33, 150, 243, 0.92)', 'rgba(33, 150, 243, 0.82)']}
        showSkip={true}
        onSkip={skipCurrentStep}
        skipLabel={t('common.skip', 'Skip')}
      >
        {/* Calculation Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('onboarding.prayerSettings.methodTitle', 'Calculation Method')}
          </Text>

          {CALCULATION_METHODS.map(method => (
            <TouchableOpacity
              key={method.id}
              style={[styles.optionCard, selectedMethod === method.id && styles.optionCardSelected]}
              onPress={() => setSelectedMethod(method.id)}
              activeOpacity={0.7}
            >
              <View style={styles.radioOuter}>
                {selectedMethod === method.id && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.optionText}>{method.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Madhhab Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('onboarding.prayerSettings.madhhabTitle', 'Madhhab (Asr Calculation)')}
          </Text>

          {MADHHAB_OPTIONS.map(madhhab => (
            <TouchableOpacity
              key={madhhab.id}
              style={[
                styles.optionCard,
                selectedMadhhab === madhhab.id && styles.optionCardSelected,
              ]}
              onPress={() => setSelectedMadhhab(madhhab.id)}
              activeOpacity={0.7}
            >
              <View style={styles.radioOuter}>
                {selectedMadhhab === madhhab.id && <View style={styles.radioInner} />}
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionText}>{madhhab.name}</Text>
                <Text style={styles.optionDescription}>{madhhab.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Note */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={theme.colors.white} />
          <Text style={styles.infoText}>
            {t(
              'onboarding.prayerSettings.info',
              'You can change these settings anytime from your profile'
            )}
          </Text>
        </View>
      </OnboardingSlide>

      <ProgressIndicator totalSteps={totalSteps} currentStep={currentStepIndex} />

      <OnboardingButtons
        showBack={true}
        showSkip={false}
        onNext={handleNext}
        onBack={goToPreviousStep}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.white,
    marginBottom: theme.spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: theme.colors.white,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.white,
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.white,
  },
  optionDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.white,
    opacity: 0.8,
    marginTop: 2,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.white,
    opacity: 0.9,
  },
});

export default PrayerSettingsScreen;
