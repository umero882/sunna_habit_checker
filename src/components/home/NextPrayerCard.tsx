/**
 * Next Prayer Card Component
 * Large card showing countdown to next prayer with prayer list
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { PRAYER_NAMES } from '../../constants/prayers';
import type { PrayerName, NextPrayerInfo } from '../../types';

export interface NextPrayerCardProps {
  nextPrayer: NextPrayerInfo | null;
  prayerTimes?: { name: PrayerName; time: string; date: Date }[];
  onLogPress?: () => void;
  onViewAllPress?: () => void;
}

interface CountdownDisplay {
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Calculate time remaining until target date and return as hours, minutes, and seconds
 * @param targetDate - The target date to count down to
 * @returns CountdownDisplay object with hours, minutes, and seconds remaining
 */
function getTimeRemaining(targetDate: Date): CountdownDisplay {
  const now = new Date();

  // Ensure targetDate is a valid Date object
  const target = targetDate instanceof Date ? targetDate : new Date(targetDate);

  const diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0 };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds };
}

export const NextPrayerCard: React.FC<NextPrayerCardProps> = ({
  nextPrayer,
  prayerTimes = [],
  onLogPress,
  onViewAllPress,
}) => {
  const [countdown, setCountdown] = useState<CountdownDisplay>(() =>
    nextPrayer ? getTimeRemaining(nextPrayer.date) : { hours: 0, minutes: 0, seconds: 0 }
  );

  // Update countdown every second
  useEffect(() => {
    if (!nextPrayer) return;

    const interval = setInterval(() => {
      setCountdown(getTimeRemaining(nextPrayer.date));
    }, 1000);

    return () => clearInterval(interval);
  }, [nextPrayer]);

  if (!nextPrayer) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="moon-outline" size={48} color={theme.colors.text.secondary} />
          <Text style={styles.emptyText}>Prayer times not available</Text>
          <Text style={styles.emptySubtext}>Pull down to refresh</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="time-outline" size={20} color={theme.colors.primary[600]} />
        <Text style={styles.title}>Next Prayer</Text>
      </View>

      {/* Countdown Timer */}
      <View style={styles.countdownContainer}>
        <Text style={styles.prayerName}>{PRAYER_NAMES[nextPrayer.name]}</Text>
        <View style={styles.timerRow}>
          <View style={styles.timerBox}>
            <Text style={styles.timerNumber}>{String(countdown.hours).padStart(2, '0')}</Text>
            <Text style={styles.timerLabel}>hours</Text>
          </View>
          <Text style={styles.timerSeparator}>:</Text>
          <View style={styles.timerBox}>
            <Text style={styles.timerNumber}>{String(countdown.minutes).padStart(2, '0')}</Text>
            <Text style={styles.timerLabel}>min</Text>
          </View>
          <Text style={styles.timerSeparator}>:</Text>
          <View style={styles.timerBox}>
            <Text style={styles.timerNumber}>{String(countdown.seconds).padStart(2, '0')}</Text>
            <Text style={styles.timerLabel}>sec</Text>
          </View>
        </View>
        <Text style={styles.prayerTime}>at {nextPrayer.time}</Text>
      </View>

      {/* Quick Prayer List */}
      {prayerTimes.length > 0 && (
        <View style={styles.prayerList}>
          <Text style={styles.listTitle}>Today's Prayers</Text>
          <View style={styles.prayerGrid}>
            {prayerTimes.slice(0, 5).map((prayer) => (
              <View key={prayer.name} style={styles.prayerItem}>
                <Text style={styles.prayerItemName}>{PRAYER_NAMES[prayer.name]}</Text>
                <Text style={styles.prayerItemTime}>{prayer.time}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={onLogPress}
          activeOpacity={0.7}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.white} />
          <Text style={styles.primaryButtonText}>Log Prayer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={onViewAllPress}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>View All</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.primary[600]} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  countdownContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  prayerName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[700],
    marginBottom: theme.spacing.sm,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  timerBox: {
    alignItems: 'center',
    minWidth: 60,
  },
  timerNumber: {
    fontSize: 36,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  timerLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: -4,
  },
  timerSeparator: {
    fontSize: 32,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.secondary,
    marginTop: -8,
  },
  prayerTime: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  prayerList: {
    marginBottom: theme.spacing.md,
  },
  listTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  prayerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  prayerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    gap: theme.spacing.xs,
  },
  prayerItemName: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
  },
  prayerItemTime: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary[600],
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary[600],
  },
  primaryButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.white,
  },
  secondaryButton: {
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.primary[600],
  },
  secondaryButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary[600],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.xs,
  },
});

export default NextPrayerCard;
