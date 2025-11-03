/**
 * Permissions Screen (Onboarding Step 5)
 * Request location and notification permissions
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { OnboardingSlide, OnboardingButtons, ProgressIndicator } from '../../components/onboarding';
import { useOnboarding } from '../../hooks/useOnboarding';
import { useUserSettings } from '../../hooks/useUserSettings';
import {
  trackPermissionRequested,
  trackPermissionGranted,
  trackPermissionDenied,
} from '../../services/analytics';
import { theme } from '../../constants/theme';

import { createLogger } from '../../utils/logger';

const logger = createLogger('PermissionsScreen');

export const PermissionsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { goToNextStep, goToPreviousStep, skipCurrentStep, currentStepIndex, totalSteps } =
    useOnboarding();
  const { updateSettings } = useUserSettings();

  const [locationEnabled, setLocationEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLocationToggle = async () => {
    if (!locationEnabled) {
      setIsLoading(true);
      trackPermissionRequested('location');
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        const granted = status === 'granted';
        setLocationEnabled(granted);

        if (granted) {
          trackPermissionGranted('location');
        } else {
          trackPermissionDenied('location');
        }
      } catch (error) {
        logger.error('Error requesting location permission:', error);
        trackPermissionDenied('location');
      } finally {
        setIsLoading(false);
      }
    } else {
      setLocationEnabled(false);
    }
  };

  const handleNotificationToggle = async () => {
    if (!notificationsEnabled) {
      setIsLoading(true);
      trackPermissionRequested('notifications');
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        const granted = status === 'granted';
        setNotificationsEnabled(granted);

        if (granted) {
          trackPermissionGranted('notifications');
          // Save notification permission to settings
          try {
            await updateSettings({ notificationsEnabled: true });
          } catch (settingsError) {
            logger.warn('Failed to save notification setting:', settingsError);
          }
        } else {
          trackPermissionDenied('notifications');
          // Save that notifications were denied
          try {
            await updateSettings({ notificationsEnabled: false });
          } catch (settingsError) {
            logger.warn('Failed to save notification setting:', settingsError);
          }
        }
      } catch (error) {
        logger.error('Error requesting notification permission:', error);
        trackPermissionDenied('notifications');
      } finally {
        setIsLoading(false);
      }
    } else {
      setNotificationsEnabled(false);
      // Save updated notification preference
      try {
        await updateSettings({ notificationsEnabled: false });
      } catch (settingsError) {
        logger.warn('Failed to save notification setting:', settingsError);
      }
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.primary[600] }}>
      <OnboardingSlide
        title={t('onboarding.permissions.title', 'Allow Permissions')}
        description={t(
          'onboarding.permissions.description',
          'To provide the best experience, we need a few permissions'
        )}
        scrollable
        showSkip={true}
        onSkip={skipCurrentStep}
        skipLabel={t('common.skip', 'Skip')}
      >
        {/* Location Permission Card */}
        <View style={styles.permissionCard}>
          <View style={styles.permissionHeader}>
            <View style={styles.permissionIcon}>
              <Ionicons name="location" size={32} color={theme.colors.primary[600]} />
            </View>
            <Switch
              value={locationEnabled}
              onValueChange={handleLocationToggle}
              disabled={isLoading}
              trackColor={{ false: '#ccc', true: theme.colors.primary[400] }}
              thumbColor={locationEnabled ? theme.colors.primary[600] : '#f4f3f4'}
            />
          </View>

          <Text style={styles.permissionTitle}>
            {t('onboarding.permissions.location.title', 'Location Access')}
          </Text>
          <Text style={styles.permissionDescription}>
            {t(
              'onboarding.permissions.location.description',
              'Required for accurate prayer times based on your location'
            )}
          </Text>

          <View style={styles.benefitsList}>
            <BenefitItem
              text={t('onboarding.permissions.location.benefit1', 'Accurate prayer times')}
            />
            <BenefitItem
              text={t('onboarding.permissions.location.benefit2', 'Auto-timezone detection')}
            />
            <BenefitItem
              text={t('onboarding.permissions.location.benefit3', 'Local Qibla direction')}
            />
          </View>
        </View>

        {/* Notification Permission Card */}
        <View style={styles.permissionCard}>
          <View style={styles.permissionHeader}>
            <View style={styles.permissionIcon}>
              <Ionicons name="notifications" size={32} color={theme.colors.primary[600]} />
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              disabled={isLoading}
              trackColor={{ false: '#ccc', true: theme.colors.primary[400] }}
              thumbColor={notificationsEnabled ? theme.colors.primary[600] : '#f4f3f4'}
            />
          </View>

          <Text style={styles.permissionTitle}>
            {t('onboarding.permissions.notifications.title', 'Notifications')}
          </Text>
          <Text style={styles.permissionDescription}>
            {t(
              'onboarding.permissions.notifications.description',
              'Get gentle reminders for prayers and daily habits'
            )}
          </Text>

          <View style={styles.benefitsList}>
            <BenefitItem
              text={t('onboarding.permissions.notifications.benefit1', 'Prayer time alerts')}
            />
            <BenefitItem
              text={t('onboarding.permissions.notifications.benefit2', 'Daily habit reminders')}
            />
            <BenefitItem
              text={t('onboarding.permissions.notifications.benefit3', 'Customizable quiet hours')}
            />
          </View>
        </View>

        {/* Privacy Note */}
        <Text style={styles.privacyNote}>
          {t(
            'onboarding.permissions.privacy',
            'Your privacy is important. You can change these settings anytime in the app.'
          )}
        </Text>
      </OnboardingSlide>

      <ProgressIndicator totalSteps={totalSteps} currentStep={currentStepIndex} />

      <OnboardingButtons
        showBack={true}
        showSkip={false}
        onNext={goToNextStep}
        onBack={goToPreviousStep}
        isLoading={isLoading}
      />
    </View>
  );
};

const BenefitItem: React.FC<{ text: string }> = ({ text }) => (
  <View style={styles.benefitItem}>
    <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary[600]} />
    <Text style={styles.benefitText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  permissionCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  permissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  permissionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  permissionDescription: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
    lineHeight: 22,
  },
  benefitsList: {
    gap: theme.spacing.xs,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  benefitText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  privacyNote: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.white,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    opacity: 0.9,
  },
});

export default PermissionsScreen;
