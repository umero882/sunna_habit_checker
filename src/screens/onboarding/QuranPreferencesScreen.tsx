/**
 * Quran Preferences Screen (Onboarding Step 7)
 * Configure Quran reciter, translation, and daily goal
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingSlide, OnboardingButtons, ProgressIndicator } from '../../components/onboarding';
import { useOnboarding } from '../../hooks/useOnboarding';
import { useQuranPreferences } from '../../hooks/useQuranPreferences';
import { trackQuranPreferencesChanged } from '../../services/analytics';
import { theme } from '../../constants/theme';

import { createLogger } from '../../utils/logger';

const logger = createLogger('QuranPreferencesScreen');

// Map friendly names to API reciter IDs
const RECITERS = [
  { id: 'ar.abdulbasit', displayName: 'AbdulBaset', name: 'Abdul Basit' },
  { id: 'ar.alafasy', displayName: 'Mishary', name: 'Mishary Rashid Alafasy' },
  { id: 'ar.abdurrahmanalsudais', displayName: 'Sudais', name: 'Abdul Rahman Al-Sudais' },
  { id: 'ar.hudhaify', displayName: 'Hudhaify', name: 'Ali Al-Hudhaify' },
];

const DAILY_GOALS = [
  { pages: 1, label: '1 page/day', duration: '~30 Months' },
  { pages: 2, label: '2 pages/day', duration: '~10 Months' },
  { pages: 4, label: '4 pages/day', duration: '~5 Months' },
  { pages: 20, label: '1 Juz/day', duration: '30 Days' },
];

export const QuranPreferencesScreen: React.FC = () => {
  const { t } = useTranslation();
  const { goToNextStep, goToPreviousStep, skipCurrentStep, currentStepIndex, totalSteps } = useOnboarding();
  const { updatePreferences, isUpdating } = useQuranPreferences();

  const [selectedReciter, setSelectedReciter] = useState('ar.alafasy'); // Default to Mishary
  const [selectedGoal, setSelectedGoal] = useState(2);

  const handleNext = async () => {
    try {
      // Get display name for analytics
      const reciterDisplayName = RECITERS.find(r => r.id === selectedReciter)?.displayName || selectedReciter;

      // Track preferences change
      trackQuranPreferencesChanged(reciterDisplayName, selectedGoal);

      // Save preferences to Supabase (which also syncs to AsyncStorage)
      await updatePreferences({
        reciter: selectedReciter,
        dailyGoalMode: 'pages',
        dailyGoalValue: selectedGoal,
      });

      goToNextStep();
    } catch (error) {
      logger.error('Error saving Quran preferences:', error);
      // Still proceed even if save fails
      goToNextStep();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(156, 39, 176, 0.92)' }}>
      <OnboardingSlide
        title={t('onboarding.quranPreferences.title', 'Quran Preferences')}
        description={t(
          'onboarding.quranPreferences.description',
          'Customize your Quran reading experience'
        )}
        scrollable
        gradientColors={['rgba(156, 39, 176, 0.92)', 'rgba(156, 39, 176, 0.82)']}
        showSkip={true}
        onSkip={skipCurrentStep}
        skipLabel={t('common.skip', 'Skip')}
      >
        {/* Reciter Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('onboarding.quranPreferences.reciterTitle', 'Choose Reciter')}
          </Text>

          {RECITERS.map((reciter) => (
            <TouchableOpacity
              key={reciter.id}
              style={[
                styles.optionCard,
                selectedReciter === reciter.id && styles.optionCardSelected,
              ]}
              onPress={() => setSelectedReciter(reciter.id)}
              activeOpacity={0.7}
            >
              <View style={styles.radioOuter}>
                {selectedReciter === reciter.id && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.optionText}>{reciter.name}</Text>
              <Ionicons name="musical-notes" size={20} color={theme.colors.white} style={{ opacity: 0.6 }} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Daily Goal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('onboarding.quranPreferences.goalTitle', 'Daily Reading Goal')}
          </Text>

          {DAILY_GOALS.map((goal) => (
            <TouchableOpacity
              key={goal.pages}
              style={[
                styles.optionCard,
                selectedGoal === goal.pages && styles.optionCardSelected,
              ]}
              onPress={() => setSelectedGoal(goal.pages)}
              activeOpacity={0.7}
            >
              <View style={styles.radioOuter}>
                {selectedGoal === goal.pages && <View style={styles.radioInner} />}
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionText}>{goal.label}</Text>
                <Text style={styles.optionDescription}>Complete in {goal.duration}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Note */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color={theme.colors.white} />
          <Text style={styles.infoText}>
            {t(
              'onboarding.quranPreferences.info',
              'These are just starting points. Adjust anytime based on your pace!'
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
        isLoading={isUpdating}
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
    flex: 1,
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

export default QuranPreferencesScreen;
