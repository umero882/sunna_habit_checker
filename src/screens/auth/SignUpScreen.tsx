/**
 * Sign Up Screen
 * Allows users to create a new account with profile information
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
import { CountryPicker } from 'react-native-country-codes-picker';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import { signUp } from '../../services/supabase';
import { Button } from '../../components/common';
import { theme } from '../../constants/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types';

import { createLogger } from '../../utils/logger';

const logger = createLogger('SignUpScreen');

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

export const SignUpScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();

  // Form fields
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('US');
  const [country, setCountry] = useState('United States');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  // Validation helpers
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phone: string, countryCode: string): boolean => {
    try {
      // Add + prefix if not present
      const phoneWithPrefix = phone.startsWith('+') ? phone : `+${phone}`;
      return isValidPhoneNumber(phoneWithPrefix, countryCode as any);
    } catch (error) {
      return false;
    }
  };

  const handleSignUp = async () => {
    // Clear previous errors
    setError('');

    // Validate all fields are filled
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!phoneNumber.trim()) {
      setError('Please enter your phone number.');
      return;
    }

    if (!country) {
      setError('Please select your country.');
      return;
    }

    if (!email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Password is required.');
      return;
    }

    // Validate email format
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    // Validate phone number format
    if (!validatePhoneNumber(phoneNumber, countryCode)) {
      setError('Please enter a valid phone number with country code (e.g., +1234567890).');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const { error: signUpError } = await signUp({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        country: country,
      });

      if (signUpError) {
        setError(signUpError.message);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      logger.error('Signup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const onSelectCountry = (selectedCountry: any) => {
    setCountryCode(selectedCountry.code);
    setCountry(selectedCountry.name?.en || selectedCountry.name || selectedCountry.code);
    setShowCountryPicker(false);
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.successContainer}>
          <Text style={styles.successEmoji}>🌸</Text>
          <Text style={styles.successTitle}>Alhamdulillah!</Text>
          <Text style={styles.successText}>
            Welcome to Sunnah Habit Checker.{'\n'}
            May Allah make every step you take a step toward His pleasure.
          </Text>
          <Button
            title="Continue to Sign In"
            onPress={() => navigation.navigate('SignIn' as any)}
            style={styles.successButton}
          />
        </View>
      </SafeAreaView>
    );
  }

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
            <Text style={styles.title}>Create Your Sunnah Habit Account 🌿</Text>
            <Text style={styles.subtitle}>
              Please fill in your details to begin tracking your Sunnah habits.{'\n'}
              Your account will help you save progress, receive gentle reminders, and grow daily
              with barakah.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Full Name Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Ahmad Ali"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoComplete="name"
                editable={!isLoading}
                accessibilityLabel="Full Name"
              />
            </View>

            {/* Phone Number Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., +1234567890"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                autoComplete="tel"
                editable={!isLoading}
                accessibilityLabel="Phone Number"
              />
              <Text style={styles.helperText}>Include country code (e.g., +1 for US)</Text>
            </View>

            {/* Country Picker */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Country *</Text>
              <TouchableOpacity
                style={styles.countryPickerButton}
                onPress={() => setShowCountryPicker(true)}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel="Select Country"
              >
                <Text style={styles.countryPickerText}>{country || 'Select your country'}</Text>
                <Text style={styles.countryPickerArrow}>▼</Text>
              </TouchableOpacity>
              <CountryPicker
                show={showCountryPicker}
                pickerButtonOnPress={onSelectCountry}
                onBackdropPress={() => setShowCountryPicker(false)}
                style={{
                  modal: {
                    height: 500,
                  },
                }}
                lang="en"
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="your.email@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!isLoading}
                accessibilityLabel="Email Address"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="At least 6 characters"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password-new"
                editable={!isLoading}
                accessibilityLabel="Password"
              />
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password-new"
                editable={!isLoading}
                accessibilityLabel="Confirm Password"
              />
            </View>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Sign Up Button */}
            <Button
              title="Create Account"
              onPress={handleSignUp}
              disabled={isLoading}
              style={styles.signUpButton}
              accessibilityLabel="Create Account"
            />

            {isLoading && (
              <ActivityIndicator
                size="large"
                color={theme.colors.primary[600]}
                style={styles.loader}
              />
            )}
          </View>

          {/* Sign In Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('SignIn' as any)}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Sign In"
            >
              <Text style={styles.footerLink}>Log in here</Text>
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
    paddingTop: theme.spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    marginBottom: theme.spacing.lg,
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
  helperText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.xs,
  },
  countryPickerButton: {
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countryPickerText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
  },
  countryPickerArrow: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
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
  signUpButton: {
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
    marginTop: theme.spacing.md,
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
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  successEmoji: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  successTitle: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.feedback.success,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  successText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  successButton: {
    minWidth: 200,
  },
});

export default SignUpScreen;
