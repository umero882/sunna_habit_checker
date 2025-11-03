/**
 * HeaderLogoutButton Component
 * Logout button for screen headers
 */

import React, { useState } from 'react';
import { TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { LogOut } from 'lucide-react-native';
import { theme } from '../../constants/theme';
import { supabase } from '../../services/supabase';

import { createLogger } from '../../utils/logger';

const logger = createLogger('HeaderLogoutButton');

export const HeaderLogoutButton: React.FC = () => {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsSigningOut(true);
            await supabase.auth.signOut();
            // Navigation will happen automatically due to auth state change
          } catch (error) {
            logger.error('Error signing out:', error);
            Alert.alert('Error', 'Failed to sign out. Please try again.');
          } finally {
            setIsSigningOut(false);
          }
        },
      },
    ]);
  };

  if (isSigningOut) {
    return <ActivityIndicator size="small" color={theme.colors.error} style={styles.loader} />;
  }

  return (
    <TouchableOpacity style={styles.button} onPress={handleSignOut} activeOpacity={0.7}>
      <LogOut size={24} color={theme.colors.error} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.xs,
  },
  loader: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.xs,
  },
});

export default HeaderLogoutButton;
