/**
 * StatisticsCard Component
 * Displays comprehensive reading statistics and analytics
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../../../constants/theme';

interface StatisticsCardProps {
  userId?: string;
  stats: {
    currentStreak: number;
    longestStreak: number;
    totalPagesRead: number;
    totalVersesRead: number;
    totalMinutesRead: number;
    surahsCompleted: number;
    thisWeek: {
      pagesRead: number;
      minutesRead: number;
      daysActive: number;
    };
    thisMonth: {
      pagesRead: number;
      minutesRead: number;
      daysActive: number;
    };
    completionPercentage: number; // 0-100 for entire Qur'an
  };
}

export const StatisticsCard: React.FC<StatisticsCardProps> = ({ stats }) => {
  // Format time duration
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Format large numbers with commas
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Your Reading Journey</Text>
        <Text style={styles.subtitle}>Track your progress and achievements</Text>
      </View>

      {/* Qur'an Completion Progress */}
      <View style={styles.completionSection}>
        <View style={styles.completionHeader}>
          <Text style={styles.sectionTitle}>Qur'an Completion</Text>
          <Text style={styles.completionPercentage}>{stats.completionPercentage.toFixed(1)}%</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${stats.completionPercentage}%` }]} />
        </View>
        <Text style={styles.progressText}>{stats.surahsCompleted} of 114 Surahs completed</Text>
      </View>

      {/* Streak Cards */}
      <View style={styles.streakSection}>
        <View style={[styles.streakCard, styles.currentStreakCard]}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakNumber}>{stats.currentStreak}</Text>
          <Text style={styles.streakLabel}>Current Streak</Text>
          <Text style={styles.streakSubtext}>days in a row</Text>
        </View>

        <View style={[styles.streakCard, styles.longestStreakCard]}>
          <Text style={styles.streakEmoji}>🏆</Text>
          <Text style={styles.streakNumber}>{stats.longestStreak}</Text>
          <Text style={styles.streakLabel}>Best Streak</Text>
          <Text style={styles.streakSubtext}>personal record</Text>
        </View>
      </View>

      {/* Overall Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{formatNumber(stats.totalPagesRead)}</Text>
          <Text style={styles.statLabel}>Pages Read</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{formatNumber(stats.totalVersesRead)}</Text>
          <Text style={styles.statLabel}>Verses Read</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{formatDuration(stats.totalMinutesRead)}</Text>
          <Text style={styles.statLabel}>Time Spent</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.surahsCompleted}</Text>
          <Text style={styles.statLabel}>Surahs Done</Text>
        </View>
      </View>

      {/* This Week Section */}
      <View style={styles.periodSection}>
        <View style={styles.periodHeader}>
          <Text style={styles.periodTitle}>This Week</Text>
          <Text style={styles.periodBadge}>{stats.thisWeek.daysActive}/7 days</Text>
        </View>
        <View style={styles.periodStats}>
          <View style={styles.periodStat}>
            <Text style={styles.periodNumber}>{stats.thisWeek.pagesRead}</Text>
            <Text style={styles.periodLabel}>pages</Text>
          </View>
          <View style={styles.periodDivider} />
          <View style={styles.periodStat}>
            <Text style={styles.periodNumber}>{formatDuration(stats.thisWeek.minutesRead)}</Text>
            <Text style={styles.periodLabel}>reading</Text>
          </View>
        </View>
      </View>

      {/* This Month Section */}
      <View style={styles.periodSection}>
        <View style={styles.periodHeader}>
          <Text style={styles.periodTitle}>This Month</Text>
          <Text style={styles.periodBadge}>{stats.thisMonth.daysActive} active days</Text>
        </View>
        <View style={styles.periodStats}>
          <View style={styles.periodStat}>
            <Text style={styles.periodNumber}>{stats.thisMonth.pagesRead}</Text>
            <Text style={styles.periodLabel}>pages</Text>
          </View>
          <View style={styles.periodDivider} />
          <View style={styles.periodStat}>
            <Text style={styles.periodNumber}>{formatDuration(stats.thisMonth.minutesRead)}</Text>
            <Text style={styles.periodLabel}>reading</Text>
          </View>
        </View>
      </View>

      {/* Motivational Message */}
      {stats.currentStreak > 0 && (
        <View style={styles.motivationBox}>
          <Text style={styles.motivationText}>
            {stats.currentStreak >= 7
              ? '🌟 Amazing consistency! Keep up the great work!'
              : stats.currentStreak >= 3
                ? "💪 Great momentum! You're building a strong habit!"
                : "✨ You're on a roll! Keep reading every day!"}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
    marginBottom: theme.spacing.md,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },

  // Completion Section
  completionSection: {
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary[700],
  },
  completionPercentage: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[600],
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: theme.colors.primary[100],
    borderRadius: 4,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary[600],
    borderRadius: 4,
  },
  progressText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  // Streak Section
  streakSection: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  streakCard: {
    flex: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  currentStreakCard: {
    backgroundColor: theme.colors.warning + '15', // Light orange
  },
  longestStreakCard: {
    backgroundColor: theme.colors.success + '15', // Light green
  },
  streakEmoji: {
    fontSize: 32,
    marginBottom: theme.spacing.xs,
  },
  streakNumber: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  streakLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  streakSubtext: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[600],
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  // Period Section (Week/Month)
  periodSection: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  periodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  periodTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  periodBadge: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary[600],
    backgroundColor: theme.colors.primary[50],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  periodStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodStat: {
    flex: 1,
    alignItems: 'center',
  },
  periodNumber: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  periodLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  periodDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.gray[300],
    marginHorizontal: theme.spacing.md,
  },

  // Motivation Box
  motivationBox: {
    backgroundColor: theme.colors.primary[50],
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary[600],
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  motivationText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary[700],
    lineHeight: 20,
  },
});

export default StatisticsCard;
