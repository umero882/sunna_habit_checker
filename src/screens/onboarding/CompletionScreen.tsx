/**
 * Completion Screen (Onboarding Step 8)
 * Celebration and journey start
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingSlide, OnboardingButtons, ProgressIndicator } from '../../components/onboarding';
import { useOnboarding } from '../../hooks/useOnboarding';
import { theme } from '../../constants/theme';

import { createLogger } from '../../utils/logger';

const logger = createLogger('CompletionScreen');

export const CompletionScreen: React.FC = () => {
  const { t } = useTranslation();
  const { completeOnboarding: complete, currentStepIndex, totalSteps } = useOnboarding();
  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    // Celebration animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleComplete = async () => {
    if (isCompleting) return; // Prevent duplicate calls

    setIsCompleting(true);
    try {
      await complete();
    } catch (error) {
      logger.error('Error completing onboarding:', error);
      setIsCompleting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(76, 175, 80, 0.95)' }}>
      <OnboardingSlide
        title={t('onboarding.complete.title', 'Alhamdulillah!')}
        description={t(
          'onboarding.complete.description',
          "You're all set to begin your spiritual journey"
        )}
        icon={
          <Animated.View
            style={[
              styles.celebrationIcon,
              {
                transform: [{ scale: scaleAnim }],
                opacity: fadeAnim,
              },
            ]}
          >
            <Ionicons name="checkmark-circle" size={100} color={theme.colors.white} />
          </Animated.View>
        }
        gradientColors={['rgba(76, 175, 80, 0.95)', 'rgba(76, 175, 80, 0.85)']}
      >
        {/* Quick Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>
            {t('onboarding.complete.tipsTitle', 'Quick Tips to Get Started')}
          </Text>

          <TipCard
            icon="time"
            title={t('onboarding.complete.tip1Title', 'Log Your First Prayer')}
            description={t(
              'onboarding.complete.tip1Description',
              'Track your prayers to build a consistent habit'
            )}
          />

          <TipCard
            icon="book"
            title={t('onboarding.complete.tip2Title', 'Start Your Quran Journey')}
            description={t(
              'onboarding.complete.tip2Description',
              'Even a few verses daily makes a difference'
            )}
          />

          <TipCard
            icon="heart"
            title={t('onboarding.complete.tip3Title', 'Add Daily Adhkar')}
            description={t(
              'onboarding.complete.tip3Description',
              'Morning and evening remembrance of Allah'
            )}
          />
        </View>

        {/* Inspirational Quote */}
        <View style={styles.quoteContainer}>
          <Ionicons
            name="chatbubble-outline"
            size={24}
            color={theme.colors.white}
            style={styles.quoteIcon}
          />
          <Text style={styles.quoteText}>
            {t(
              'onboarding.complete.quote',
              'The most beloved deeds to Allah are those done consistently, even if they are small.'
            )}
          </Text>
          <Text style={styles.quoteAttribution}>
            {t('onboarding.complete.quoteSource', '- Prophet Muhammad ﷺ')}
          </Text>
        </View>
      </OnboardingSlide>

      <ProgressIndicator totalSteps={totalSteps} currentStep={currentStepIndex} />

      <OnboardingButtons
        showBack={false}
        showSkip={false}
        onNext={handleComplete}
        isLastStep={true}
        isLoading={isCompleting}
        completeLabel={t('onboarding.complete.button', 'Start Your Journey')}
      />
    </View>
  );
};

const TipCard: React.FC<{ icon: string; title: string; description: string }> = ({
  icon,
  title,
  description,
}) => (
  <View style={styles.tipCard}>
    <View style={styles.tipIconContainer}>
      <Ionicons name={icon as any} size={24} color={theme.colors.primary[600]} />
    </View>
    <View style={styles.tipContent}>
      <Text style={styles.tipTitle}>{title}</Text>
      <Text style={styles.tipDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  celebrationIcon: {
    marginBottom: theme.spacing.md,
  },
  tipsContainer: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  tipsTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.white,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.md,
  },
  tipIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  tipDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.white,
    opacity: 0.9,
    lineHeight: 20,
  },
  quoteContainer: {
    marginTop: theme.spacing.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.white,
  },
  quoteIcon: {
    marginBottom: theme.spacing.sm,
    opacity: 0.7,
  },
  quoteText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.white,
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: theme.spacing.sm,
  },
  quoteAttribution: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeight.semibold,
    opacity: 0.9,
  },
});

export default CompletionScreen;
