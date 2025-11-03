/**
 * Prayer Streak Card
 * Display current and longest prayer streaks with visual elements
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import type { StreakInfo } from '../../hooks/usePrayerStats';
import { format, parseISO } from 'date-fns';

export interface StreakCardProps {
  streak: StreakInfo;
}

export const StreakCard: React.FC<StreakCardProps> = ({ streak }) => {
  const { currentStreak, longestStreak, lastPrayedDate } = streak;

  // Determine streak status and color
  const isOnStreak = currentStreak > 0;
  const streakColor = isOnStreak ? theme.colors.success : theme.colors.gray[400];
  const streakIcon = isOnStreak ? 'flame' : 'flame-outline';

  // Get motivational message based on streak
  const getStreakMessage = () => {
    if (currentStreak === 0) {
      return 'Start your streak today!';
    } else if (currentStreak === 1) {
      return 'Great start! Keep going!';
    } else if (currentStreak < 7) {
      return 'Building momentum!';
    } else if (currentStreak < 30) {
      return 'Excellent consistency!';
    } else if (currentStreak < 100) {
      return 'Mashallah! Amazing dedication!';
    } else {
      return 'Subhanallah! Exceptional commitment!';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <Ionicons name={streakIcon} size={24} color={streakColor} />
          <Text style={styles.title}>Prayer Streak</Text>
        </View>
        <Text style={styles.subtitle}>{getStreakMessage()}</Text>
      </View>

      <View style={styles.content}>
        {/* Current Streak */}
        <View style={[styles.streakBox, styles.currentStreakBox]}>
          <View style={styles.streakIconContainer}>
            <Ionicons name={streakIcon} size={32} color={streakColor} />
          </View>
          <Text style={[styles.streakNumber, { color: streakColor }]}>{currentStreak}</Text>
          <Text style={styles.streakLabel}>Current Streak</Text>
          <Text style={styles.streakSubLabel}>
            {currentStreak === 1 ? 'day' : 'days'} of 100% completion
          </Text>
        </View>

        {/* Longest Streak */}
        <View style={[styles.streakBox, styles.longestStreakBox]}>
          <View style={styles.streakIconContainer}>
            <Ionicons name="trophy" size={32} color={theme.colors.warning} />
          </View>
          <Text style={[styles.streakNumber, { color: theme.colors.warning }]}>
            {longestStreak}
          </Text>
          <Text style={styles.streakLabel}>Personal Best</Text>
          <Text style={styles.streakSubLabel}>
            {longestStreak === currentStreak && currentStreak > 0
              ? 'Active now!'
              : 'Longest streak'}
          </Text>
        </View>
      </View>

      {/* Last Prayed Info */}
      {lastPrayedDate && (
        <View style={styles.footer}>
          <Ionicons name="time-outline" size={14} color={theme.colors.text.tertiary} />
          <Text style={styles.footerText}>
            Last prayed: {format(parseISO(lastPrayedDate), 'MMM d, yyyy')}
          </Text>
        </View>
      )}

      {/* Progress to Next Milestone */}
      {currentStreak > 0 && (
        <View style={styles.milestoneSection}>
          {currentStreak < 7 && (
            <MilestoneProgress
              current={currentStreak}
              target={7}
              label="First Week"
              icon="ribbon"
            />
          )}
          {currentStreak >= 7 && currentStreak < 30 && (
            <MilestoneProgress current={currentStreak} target={30} label="One Month" icon="medal" />
          )}
          {currentStreak >= 30 && currentStreak < 100 && (
            <MilestoneProgress
              current={currentStreak}
              target={100}
              label="100 Days"
              icon="trophy"
            />
          )}
          {currentStreak >= 100 && (
            <View style={styles.achievementBadge}>
              <Ionicons name="star" size={20} color={theme.colors.warning} />
              <Text style={styles.achievementText}>Century Club Member!</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

interface MilestoneProgressProps {
  current: number;
  target: number;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const MilestoneProgress: React.FC<MilestoneProgressProps> = ({ current, target, label, icon }) => {
  const progress = Math.min((current / target) * 100, 100);
  const remaining = Math.max(target - current, 0);

  return (
    <View style={styles.milestoneContainer}>
      <View style={styles.milestoneHeader}>
        <View style={styles.milestoneTitle}>
          <Ionicons name={icon} size={16} color={theme.colors.primary[600]} />
          <Text style={styles.milestoneLabel}>Next: {label}</Text>
        </View>
        <Text style={styles.milestoneRemaining}>{remaining} days to go</Text>
      </View>
      <View style={styles.milestoneBar}>
        <View
          style={[
            styles.milestoneProgress,
            {
              width: `${progress}%`,
              backgroundColor: theme.colors.primary[600],
            },
          ]}
        />
      </View>
      <Text style={styles.milestonePercentage}>{Math.round(progress)}% complete</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  header: {
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs / 2,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  content: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  streakBox: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.xs,
  },
  currentStreakBox: {
    backgroundColor: `${theme.colors.success}10`,
    borderWidth: 2,
    borderColor: `${theme.colors.success}30`,
  },
  longestStreakBox: {
    backgroundColor: `${theme.colors.warning}10`,
    borderWidth: 2,
    borderColor: `${theme.colors.warning}30`,
  },
  streakIconContainer: {
    marginBottom: theme.spacing.xs / 2,
  },
  streakNumber: {
    fontSize: 40,
    fontWeight: theme.typography.fontWeight.bold,
    lineHeight: 48,
  },
  streakLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  streakSubLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs / 2,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  footerText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  milestoneSection: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  milestoneContainer: {
    gap: theme.spacing.xs,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  milestoneTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs / 2,
  },
  milestoneLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  milestoneRemaining: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  milestoneBar: {
    height: 6,
    backgroundColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  milestoneProgress: {
    height: '100%',
    borderRadius: theme.borderRadius.full,
  },
  milestonePercentage: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    textAlign: 'right',
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
    backgroundColor: `${theme.colors.warning}15`,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.warning,
  },
  achievementText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.warning,
  },
});

export default StreakCard;
