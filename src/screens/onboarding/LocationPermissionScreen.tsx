/**
 * Location Permission Onboarding Screen
 * Educates users about location permission and requests it
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { theme } from '../../constants/theme';
import { requestLocationPermission } from '../../services/location';

import { createLogger } from '../../utils/logger';

const logger = createLogger('LocationPermissionScreen');

interface LocationPermissionScreenProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export const LocationPermissionScreen: React.FC<LocationPermissionScreenProps> = ({
  onComplete,
  onSkip,
}) => {
  const { t } = useTranslation();
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnableLocation = async () => {
    setIsRequesting(true);
    setError(null);

    try {
      const result = await requestLocationPermission();

      if (result.granted) {
        // Permission granted, proceed
        onComplete();
      } else {
        // Permission denied
        setError(
          result.canAskAgain
            ? 'Location permission is required for accurate prayer times. Please grant permission when prompted.'
            : 'Location permission was permanently denied. Please enable it in your device settings to use this feature.'
        );
      }
    } catch (err: any) {
      logger.error('Error requesting location permission:', err);
      setError('Failed to request location permission. Please try again.');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.icon}>📍</Text>
          <Text style={styles.title}>Enable Location</Text>
          <Text style={styles.subtitle}>
            We need your location to calculate accurate prayer times for your area
          </Text>
        </View>

        {/* Benefits List */}
        <View style={styles.benefits}>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🕌</Text>
            <View style={styles.benefitText}>
              <Text style={styles.benefitTitle}>Accurate Prayer Times</Text>
              <Text style={styles.benefitDescription}>
                Get precise prayer times based on your current location
              </Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🌍</Text>
            <View style={styles.benefitText}>
              <Text style={styles.benefitTitle}>Auto-Update</Text>
              <Text style={styles.benefitDescription}>
                Prayer times update automatically when you travel
              </Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🔒</Text>
            <View style={styles.benefitText}>
              <Text style={styles.benefitTitle}>Privacy First</Text>
              <Text style={styles.benefitDescription}>
                Your location is only used locally to calculate prayer times
              </Text>
            </View>
          </View>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleEnableLocation}
            disabled={isRequesting}
          >
            {isRequesting ? (
              <ActivityIndicator color={theme.colors.text.inverse} />
            ) : (
              <Text style={styles.primaryButtonText}>Enable Location</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleSkip}
            disabled={isRequesting}
          >
            <Text style={styles.secondaryButtonText}>Skip for Now</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Note */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            You can enable location permission later in Settings
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  content: {
    flex: 1,
    padding: theme.spacing.xl,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  icon: {
    fontSize: 80,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  benefits: {
    gap: theme.spacing.lg,
    marginVertical: theme.spacing.xl,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  benefitIcon: {
    fontSize: 32,
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  benefitDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: theme.colors.feedback.error + '20',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.feedback.error,
    textAlign: 'center',
  },
  actions: {
    gap: theme.spacing.md,
  },
  button: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary[600],
  },
  primaryButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
  },
  secondaryButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  footer: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  footerText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});

export default LocationPermissionScreen;
