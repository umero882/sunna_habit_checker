/**
 * Greeting Header Component
 * Displays personalized greeting, date, and next prayer info
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { PRAYER_NAMES } from '../../constants/prayers';
import { useGreeting, useIslamicGreeting } from '../../hooks/useGreeting';
import { useFormattedDates } from '../../hooks/useHijriDate';
import { ProfileAvatar } from '../common/ProfileAvatar';
import type { PrayerName } from '../../types';

export interface GreetingHeaderProps {
  userName?: string;
  nextPrayer?: {
    name: PrayerName;
    timeRemaining: string;
  } | null;
  pendingSunnahCount?: number;
  onSettingsPress?: () => void;
}

export const GreetingHeader: React.FC<GreetingHeaderProps> = ({
  userName = 'Friend',
  nextPrayer,
  pendingSunnahCount = 0,
  onSettingsPress,
}) => {
  const islamicGreeting = useIslamicGreeting('en');
  const { greeting, icon } = useGreeting('en');
  const { gregorian, hijri } = useFormattedDates('en');

  return (
    <View style={styles.container}>
      {/* Top Row: Islamic Greeting + Settings */}
      <View style={styles.topRow}>
        <View style={styles.greetingContainer}>
          <Text style={styles.islamicGreeting}>{islamicGreeting}</Text>
          <View style={styles.nameRow}>
            <Text style={styles.greeting}>{greeting}, </Text>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.greetingIcon}> {icon}</Text>
          </View>
        </View>

        {/* Profile Avatar - navigates to profile */}
        <ProfileAvatar size={44} />
      </View>

      {/* Date Row */}
      <View style={styles.dateContainer}>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} />
          <Text style={styles.dateText}>{gregorian}</Text>
        </View>
        <Text style={styles.hijriDate}>{hijri}</Text>
      </View>

      {/* Next Prayer & Pending Sunnah */}
      {(nextPrayer || pendingSunnahCount > 0) && (
        <View style={styles.statusContainer}>
          {nextPrayer && (
            <View style={styles.statusItem}>
              <Ionicons name="time-outline" size={14} color={theme.colors.primary[600]} />
              <Text style={styles.statusText}>
                {PRAYER_NAMES[nextPrayer.name]} in {nextPrayer.timeRemaining}
              </Text>
            </View>
          )}

          {pendingSunnahCount > 0 && (
            <View style={styles.statusItem}>
              <Ionicons name="sunny-outline" size={14} color={theme.colors.secondary[600]} />
              <Text style={styles.statusText}>
                {pendingSunnahCount} Sunnah{pendingSunnahCount !== 1 ? 's' : ''} await
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  greetingContainer: {
    flex: 1,
  },
  islamicGreeting: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  greeting: {
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  userName: {
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.primary[700],
    fontWeight: theme.typography.fontWeight.bold,
  },
  greetingIcon: {
    fontSize: theme.typography.fontSize.lg,
  },
  settingsButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  dateContainer: {
    marginTop: theme.spacing.xs,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  dateText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  hijriDate: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginLeft: 22, // Align with Gregorian date
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.md,
    gap: theme.spacing.md,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
});

export default GreetingHeader;
