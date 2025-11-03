/**
 * Profile Screen
 * Complete user profile with settings, progress analytics, and account management
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  LogBox,
} from 'react-native';

// Suppress VirtualizedList warning for Victory charts
LogBox.ignoreLogs(['VirtualizedLists should never be nested']);
import {
  Settings,
  Bell,
  User,
  Lock,
  Globe,
  Moon,
  Calendar,
  Zap,
  LogOut,
  Trash2,
  FileDown,
  Sun,
  RotateCcw,
  Cloud,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types';
import { theme } from '../constants/theme';
import { useUserSettings } from '../hooks/useUserSettings';
import { useProfile } from '../hooks/useProfile';
import { supabase } from '../services/supabase';
import { resetOnboarding } from '../services/onboarding';
import {
  ProfileHeader,
  ProgressSummary,
  SettingsSection,
  SettingRow,
  ExportDataModal,
  EditProfileModal,
} from '../components/profile';
import { Locale, Madhhab } from '../types';

import { createLogger } from '../utils/logger';

const logger = createLogger('ProfileScreen');

// Prayer calculation methods
const PRAYER_CALC_METHODS = [
  { label: 'Muslim World League', value: 'MuslimWorldLeague' },
  { label: 'Islamic Society of North America', value: 'NorthAmerica' },
  { label: 'Egyptian General Authority', value: 'Egyptian' },
  { label: 'Umm Al-Qura University', value: 'UmmAlQura' },
  { label: 'University of Islamic Sciences, Karachi', value: 'Karachi' },
  { label: 'Dubai', value: 'Dubai' },
  { label: 'Kuwait', value: 'Kuwait' },
  { label: 'Qatar', value: 'Qatar' },
  { label: 'Singapore', value: 'Singapore' },
  { label: 'Tehran', value: 'Tehran' },
  { label: 'Turkey', value: 'Turkey' },
];

const MADHHAB_OPTIONS: Madhhab[] = ['Standard', 'Hanafi'];

type NavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {
    settings,
    isLoading: settingsLoading,
    error: settingsError,
    updateSettings,
  } = useUserSettings();
  const {
    profile,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useProfile();
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isResettingOnboarding, setIsResettingOnboarding] = useState(false);

  const isLoading = settingsLoading || profileLoading;
  const hasError = settingsError || profileError;

  // Log errors for debugging
  React.useEffect(() => {
    if (settingsError) {
      logger.error('Settings error:', settingsError);
    }
    if (profileError) {
      logger.error('Profile error:', profileError);
    }
  }, [settingsError, profileError]);

  // Handle sign out
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

  // Handle delete account
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This action cannot be undone. Are you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Second confirmation
            Alert.alert('Final Confirmation', 'Type "DELETE" to confirm account deletion.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Confirm Delete',
                style: 'destructive',
                onPress: async () => {
                  try {
                    // TODO: Implement account deletion via Supabase RPC
                    Alert.alert(
                      'Account Deletion',
                      'Please contact support to delete your account.',
                      [{ text: 'OK' }]
                    );
                  } catch (error) {
                    logger.error('Error deleting account:', error);
                    Alert.alert('Error', 'Failed to delete account. Please try again.');
                  }
                },
              },
            ]);
          },
        },
      ]
    );
  };

  // Handle language selection
  const handleLanguageChange = () => {
    Alert.alert('Select Language', '', [
      {
        text: 'English',
        onPress: () => updateSettings({ locale: 'en' as Locale }),
      },
      {
        text: 'العربية (Arabic)',
        onPress: () => updateSettings({ locale: 'ar' as Locale }),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // Handle madhhab selection
  const handleMadhhabChange = () => {
    Alert.alert('Select Madhhab (for Asr prayer)', '', [
      {
        text: 'Standard',
        onPress: () => updateSettings({ madhhab: 'Standard' as Madhhab }),
      },
      {
        text: 'Hanafi',
        onPress: () => updateSettings({ madhhab: 'Hanafi' as Madhhab }),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // Handle prayer calc method selection
  const handlePrayerCalcMethodChange = () => {
    Alert.alert('Prayer Calculation Method', 'Select your preferred method', [
      ...PRAYER_CALC_METHODS.map(method => ({
        text: method.label,
        onPress: () => updateSettings({ prayerCalcMethod: method.value }),
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // Handle reset onboarding
  const handleResetOnboarding = () => {
    Alert.alert(
      'Reset Onboarding',
      'This will show you the onboarding tour again. You will need to restart the app after resetting.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'default',
          onPress: async () => {
            try {
              setIsResettingOnboarding(true);
              await resetOnboarding();
              Alert.alert(
                'Onboarding Reset',
                'Please restart the app to see the onboarding tour again.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Sign out to force app restart
                      supabase.auth.signOut();
                    },
                  },
                ]
              );
            } catch (error) {
              logger.error('Error resetting onboarding:', error);
              Alert.alert('Error', 'Failed to reset onboarding. Please try again.');
            } finally {
              setIsResettingOnboarding(false);
            }
          },
        },
      ]
    );
  };

  // Only show loading if both are loading AND we don't have any data yet
  if (isLoading && !settings && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[600]} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  // If there's an error but we've been loading for too long, show the page anyway
  // This prevents infinite loading if stats hooks are stuck
  if (hasError && !settings && !profile) {
    logger.debug('Showing profile despite errors to prevent infinite loading');
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      nestedScrollEnabled={true}
    >
      {/* Profile Header */}
      <ProfileHeader onEditPress={() => setEditProfileModalVisible(true)} />

      {/* Progress Summary */}
      <ProgressSummary />

      {/* Spiritual Settings */}
      <SettingsSection
        title="Spiritual Preferences"
        icon={<Sun size={24} color={theme.colors.primary[600]} />}
        description="Customize your Islamic settings"
      >
        <SettingRow
          type="select"
          label="Language"
          value={settings?.locale === 'ar' ? 'Arabic' : 'English'}
          icon={<Globe size={20} color={theme.colors.gray[600]} />}
          onPress={handleLanguageChange}
        />
        <SettingRow
          type="toggle"
          label="Hijri Calendar"
          description="Show Islamic dates alongside Gregorian"
          value={settings?.hijriEnabled ?? false}
          icon={<Calendar size={20} color={theme.colors.gray[600]} />}
          onToggle={value => updateSettings({ hijriEnabled: value })}
        />
        <SettingRow
          type="select"
          label="Madhhab (Asr Time)"
          value={settings?.madhhab || 'Standard'}
          icon={<Settings size={20} color={theme.colors.gray[600]} />}
          onPress={handleMadhhabChange}
        />
        <SettingRow
          type="select"
          label="Prayer Calculation Method"
          value={
            PRAYER_CALC_METHODS.find(m => m.value === settings?.prayerCalcMethod)?.label ||
            'Muslim World League'
          }
          icon={<Settings size={20} color={theme.colors.gray[600]} />}
          onPress={handlePrayerCalcMethodChange}
        />
        <SettingRow
          type="toggle"
          label="Barakah Points"
          description="Show motivational points for good deeds"
          value={settings?.barakahPointsEnabled ?? false}
          icon={<Zap size={20} color={theme.colors.gray[600]} />}
          onToggle={value => updateSettings({ barakahPointsEnabled: value })}
        />
      </SettingsSection>

      {/* System Settings */}
      <SettingsSection
        title="System Preferences"
        icon={<Settings size={24} color={theme.colors.primary[600]} />}
        description="App behavior and appearance"
      >
        <SettingRow
          type="info"
          label="Dark Mode"
          value="Coming Soon"
          icon={<Moon size={20} color={theme.colors.gray[600]} />}
          disabled
        />
        <SettingRow
          type="toggle"
          label="Notifications"
          description="Enable prayer and habit reminders"
          value={settings?.notificationsEnabled ?? true}
          icon={<Bell size={20} color={theme.colors.gray[600]} />}
          onToggle={value => updateSettings({ notificationsEnabled: value })}
        />
      </SettingsSection>

      {/* Privacy & Data */}
      <SettingsSection
        title="Privacy & Data"
        icon={<Lock size={24} color={theme.colors.primary[600]} />}
        description="Manage your data and privacy"
      >
        <SettingRow
          type="navigation"
          label="Export Data"
          description="Download your progress as PDF"
          icon={<FileDown size={20} color={theme.colors.gray[600]} />}
          onPress={() => setExportModalVisible(true)}
        />
        <SettingRow
          type="navigation"
          label="Backup & Restore"
          description="Cloud backup and data recovery"
          icon={<Cloud size={20} color={theme.colors.gray[600]} />}
          onPress={() => navigation.navigate('Backup')}
        />
        <View style={styles.privacyInfo}>
          <Text style={styles.privacyText}>
            🔒 All your worship data is private and encrypted. No leaderboards, no comparisons with
            others. Your deeds are between you and Allah.
          </Text>
        </View>
      </SettingsSection>

      {/* Developer Settings */}
      <SettingsSection
        title="Advanced"
        icon={<Settings size={24} color={theme.colors.primary[600]} />}
        description="Advanced settings and testing"
        defaultExpanded={false}
      >
        <SettingRow
          type="navigation"
          label="Reset Onboarding"
          description="See the welcome tour again"
          icon={<RotateCcw size={20} color={theme.colors.gray[600]} />}
          onPress={handleResetOnboarding}
          loading={isResettingOnboarding}
        />
      </SettingsSection>

      {/* Account Management */}
      <SettingsSection
        title="Account"
        icon={<User size={24} color={theme.colors.primary[600]} />}
        description="Manage your account"
        defaultExpanded={false}
      >
        <SettingRow
          type="navigation"
          label="Sign Out"
          icon={<LogOut size={20} color={theme.colors.error} />}
          onPress={handleSignOut}
          loading={isSigningOut}
        />
        <SettingRow
          type="navigation"
          label="Delete Account"
          description="Permanently delete your account and all data"
          icon={<Trash2 size={20} color={theme.colors.error} />}
          onPress={handleDeleteAccount}
        />
      </SettingsSection>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerQuote}>
          "Take account of yourselves before you are taken to account."
        </Text>
        <Text style={styles.footerAttribution}>— Umar ibn al-Khattab (RA)</Text>
        <Text style={styles.footerApp}>Sunnah Habit Checker v1.0</Text>
      </View>

      {/* Export Modal */}
      <ExportDataModal visible={exportModalVisible} onClose={() => setExportModalVisible(false)} />

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={editProfileModalVisible}
        onClose={() => setEditProfileModalVisible(false)}
        currentName={profile?.metadata?.name || ''}
        currentPhone={''}
        currentEmail={profile?.email || ''}
        currentAvatarUrl={profile?.metadata?.avatar_url || ''}
        onSuccess={refetchProfile}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  contentContainer: {
    paddingBottom: theme.spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },
  privacyInfo: {
    backgroundColor: theme.colors.primary[50],
    padding: theme.spacing.md,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary[600],
  },
  privacyText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary[700],
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.sm,
  },
  footer: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  footerQuote: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 4,
  },
  footerAttribution: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.md,
  },
  footerApp: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
});

export default ProfileScreen;
