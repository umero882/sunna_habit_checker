/**
 * Sign In Screen
 * Allows users to sign in with email/password
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { signIn } from '../../services/supabase';
import { Button } from '../../components/common';
import { theme } from '../../constants/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'SignIn'>;

export const SignInScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    if (!email || !password) {
      setError(t('auth.errors.fillAllFields'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        setError(signInError.message);
      }
      // Navigation will be handled by auth state change listener
    } catch (err) {
      setError(t('auth.errors.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('auth.signIn.title')}</Text>
            <Text style={styles.subtitle}>{t('auth.signIn.subtitle')}</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.email')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!isLoading}
                accessibilityLabel={t('auth.email')}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('auth.password')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('auth.passwordPlaceholder')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                editable={!isLoading}
                accessibilityLabel={t('auth.password')}
              />
            </View>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Forgot Password Link */}
            <TouchableOpacity
              onPress={() => navigation.navigate('ResetPassword' as any)}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel={t('auth.forgotPassword')}
            >
              <Text style={styles.forgotPassword}>{t('auth.forgotPassword')}</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <Button
              title={t('auth.signIn.button')}
              onPress={handleSignIn}
              disabled={isLoading}
              style={styles.signInButton}
              accessibilityLabel={t('auth.signIn.button')}
            />

            {isLoading && (
              <ActivityIndicator
                size="large"
                color={theme.colors.primary[600]}
                style={styles.loader}
              />
            )}
          </View>

          {/* Sign Up Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.signIn.noAccount')}</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('SignUp' as any)}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel={t('auth.signUp.title')}
            >
              <Text style={styles.footerLink}>{t('auth.signUp.link')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
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
  },
  form: {
    marginBottom: theme.spacing.xl,
  },
  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
  },
  errorContainer: {
    backgroundColor: theme.colors.feedback.error + '20',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.feedback.error,
    fontSize: theme.typography.fontSize.sm,
    textAlign: 'center',
  },
  forgotPassword: {
    color: theme.colors.primary[600],
    fontSize: theme.typography.fontSize.sm,
    textAlign: 'right',
    marginBottom: theme.spacing.lg,
  },
  signInButton: {
    marginTop: theme.spacing.md,
  },
  loader: {
    marginTop: theme.spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  footerText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },
  footerLink: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeight.semibold,
  },
});

export default SignInScreen;
