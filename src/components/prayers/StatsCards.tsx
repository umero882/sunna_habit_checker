/**
 * Prayer Statistics Cards
 * Display weekly and monthly statistics in card format
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import type { WeeklyStats, MonthlyStats } from '../../hooks/usePrayerStats';
import { format, parseISO } from 'date-fns';

export interface StatsCardsProps {
  weekly: WeeklyStats;
  monthly: MonthlyStats;
}

interface StatItemProps {
  label: string;
  value: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
}

const StatItem: React.FC<StatItemProps> = ({
  label,
  value,
  icon,
  color = theme.colors.primary[600],
}) => (
  <View style={styles.statItem}>
    {icon && <Ionicons name={icon} size={16} color={color} style={styles.statIcon} />}
    <View style={styles.statContent}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </View>
);

interface ProgressBarProps {
  label: string;
  percentage: number;
  color?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  label,
  percentage,
  color = theme.colors.primary[600],
}) => (
  <View style={styles.progressContainer}>
    <View style={styles.progressHeader}>
      <Text style={styles.progressLabel}>{label}</Text>
      <Text style={styles.progressValue}>{percentage}%</Text>
    </View>
    <View style={styles.progressBar}>
      <View
        style={[
          styles.progressFill,
          {
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  </View>
);

export const StatsCards: React.FC<StatsCardsProps> = ({ weekly, monthly }) => {
  return (
    <View style={styles.container}>
      {/* Weekly Stats Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="calendar-outline" size={20} color={theme.colors.primary[600]} />
            <Text style={styles.cardTitle}>This Week</Text>
          </View>
          <Text style={styles.dateRange}>
            {format(parseISO(weekly.weekStart), 'MMM d')} - {format(parseISO(weekly.weekEnd), 'd')}
          </Text>
        </View>

        <View style={styles.cardContent}>
          {/* Main Stat */}
          <View style={styles.mainStat}>
            <Text style={styles.mainStatValue}>
              {weekly.prayersLogged}/{weekly.totalPrayers}
            </Text>
            <Text style={styles.mainStatLabel}>Prayers Logged</Text>
          </View>

          {/* Progress Bars */}
          <View style={styles.progressSection}>
            <ProgressBar
              label="Completion"
              percentage={weekly.completionPercentage}
              color={theme.colors.primary[600]}
            />
            <ProgressBar
              label="On Time"
              percentage={weekly.onTimePercentage}
              color={theme.colors.success}
            />
            <ProgressBar
              label="In Jamaah"
              percentage={weekly.jamaahPercentage}
              color={theme.colors.info}
            />
          </View>

          {/* Best/Worst Days */}
          {(weekly.bestDay || weekly.worstDay) && (
            <View style={styles.daysRow}>
              {weekly.bestDay && (
                <View style={[styles.dayBadge, styles.bestDay]}>
                  <Ionicons name="trophy" size={14} color={theme.colors.success} />
                  <Text style={styles.dayBadgeLabel}>Best Day</Text>
                  <Text style={styles.dayBadgeValue}>
                    {format(parseISO(weekly.bestDay.date), 'EEE')}: {weekly.bestDay.completion}%
                  </Text>
                </View>
              )}
              {weekly.worstDay && weekly.worstDay.completion < 100 && (
                <View style={[styles.dayBadge, styles.worstDay]}>
                  <Ionicons name="alert-circle" size={14} color={theme.colors.warning} />
                  <Text style={styles.dayBadgeLabel}>Needs Work</Text>
                  <Text style={styles.dayBadgeValue}>
                    {format(parseISO(weekly.worstDay.date), 'EEE')}: {weekly.worstDay.completion}%
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Monthly Stats Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="stats-chart-outline" size={20} color={theme.colors.secondary[600]} />
            <Text style={styles.cardTitle}>This Month</Text>
          </View>
          <Text style={styles.dateRange}>{format(parseISO(monthly.monthStart), 'MMMM yyyy')}</Text>
        </View>

        <View style={styles.cardContent}>
          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <StatItem
              icon="checkmark-circle"
              label="Total Logged"
              value={`${monthly.prayersLogged}/${monthly.totalPrayers}`}
              color={theme.colors.primary[600]}
            />
            <StatItem
              icon="time"
              label="On Time"
              value={`${monthly.onTimePercentage}%`}
              color={theme.colors.success}
            />
            <StatItem
              icon="people"
              label="In Jamaah"
              value={`${monthly.jamaahPercentage}%`}
              color={theme.colors.info}
            />
            <StatItem
              icon="trending-up"
              label="Daily Avg"
              value={monthly.dailyAverage}
              color={theme.colors.secondary[600]}
            />
          </View>

          {/* Completion Bar */}
          <View style={styles.monthlyCompletion}>
            <ProgressBar
              label="Overall Completion"
              percentage={monthly.completionPercentage}
              color={theme.colors.secondary[600]}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  dateRange: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  cardContent: {
    gap: theme.spacing.md,
  },
  mainStat: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
  },
  mainStatValue: {
    fontSize: 36,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[700],
    marginBottom: theme.spacing.xs,
  },
  mainStatLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  progressSection: {
    gap: theme.spacing.sm,
  },
  progressContainer: {
    gap: theme.spacing.xs / 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  progressValue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.borderRadius.full,
  },
  daysRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  dayBadge: {
    flex: 1,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs / 2,
  },
  bestDay: {
    backgroundColor: `${theme.colors.success}15`,
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  worstDay: {
    backgroundColor: `${theme.colors.warning}15`,
    borderWidth: 1,
    borderColor: theme.colors.warning,
  },
  dayBadgeLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  dayBadgeValue: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
  },
  statIcon: {
    marginRight: theme.spacing.xs / 2,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  monthlyCompletion: {
    marginTop: theme.spacing.xs,
  },
});

export default StatsCards;
