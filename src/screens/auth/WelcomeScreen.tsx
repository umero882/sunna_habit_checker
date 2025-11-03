/**
 * Welcome Screen
 * Initial screen shown to unauthenticated users
 */

import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/common';
import { theme } from '../../constants/theme';

interface WelcomeScreenProps {
  onSignIn: () => void;
  onSignUp: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSignIn, onSignUp }) => {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{t('onboarding.welcome.title')}</Text>
          <Text style={styles.appName}>{t('app.name')}</Text>
          <Text style={styles.tagline}>{t('app.tagline')}</Text>
        </View>

        {/* Illustration Placeholder */}
        <View style={styles.illustration}>
          <View style={styles.illustrationPlaceholder}>
            <Text style={styles.illustrationText}>🕌</Text>
            <Text style={styles.illustrationSubtext}>Build Better Habits</Text>
          </View>
        </View>

        {/* Call to Action Buttons */}
        <View style={styles.actions}>
          <Button
            title={t('auth.signUp.button')}
            onPress={onSignUp}
            variant="primary"
            style={styles.button}
            accessibilityLabel={t('auth.signUp.button')}
          />

          <Button
            title={t('auth.signIn.button')}
            onPress={onSignIn}
            variant="outline"
            style={styles.button}
            accessibilityLabel={t('auth.signIn.button')}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>May Allah make consistency easy for you</Text>
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
  greeting: {
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  appName: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[600],
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  tagline: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  illustration: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationPlaceholder: {
    alignItems: 'center',
  },
  illustrationText: {
    fontSize: 120,
    marginBottom: theme.spacing.md,
  },
  illustrationSubtext: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  actions: {
    gap: theme.spacing.md,
  },
  button: {
    minHeight: 56,
  },
  footer: {
    marginTop: theme.spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default WelcomeScreen;
