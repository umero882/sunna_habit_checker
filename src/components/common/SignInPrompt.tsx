/**
 * SignInPrompt Component
 * Reusable component for showing sign-in prompts with navigation to Profile
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { LogIn, User } from 'lucide-react-native';
import { theme } from '../../constants/theme';
import type { MainTabParamList } from '../../types';

interface SignInPromptProps {
  title?: string;
  message?: string;
  icon?: 'login' | 'profile';
  showViewProfileButton?: boolean;
}

export const SignInPrompt: React.FC<SignInPromptProps> = ({
  title = 'Sign In Required',
  message = 'Please sign in to access this feature and track your progress',
  icon = 'login',
  showViewProfileButton = true,
}) => {
  const navigation = useNavigation<NavigationProp<MainTabParamList>>();

  const handleNavigateToProfile = () => {
    navigation.navigate('ProfileTab');
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {icon === 'login' ? (
          <LogIn size={48} color={theme.colors.primary[400]} />
        ) : (
          <User size={48} color={theme.colors.primary[400]} />
        )}
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      {showViewProfileButton && (
        <TouchableOpacity
          style={styles.button}
          onPress={handleNavigateToProfile}
          activeOpacity={0.8}
        >
          <User size={20} color={theme.colors.background.primary} />
          <Text style={styles.buttonText}>View Profile</Text>
        </TouchableOpacity>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          💡 Already signed in? You can sign out from the Profile tab.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background.secondary,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.md,
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary[600],
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.md,
    gap: theme.spacing.sm,
  },
  buttonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.background.primary,
  },
  infoBox: {
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.background.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary[600],
  },
  infoText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});

export default SignInPrompt;
