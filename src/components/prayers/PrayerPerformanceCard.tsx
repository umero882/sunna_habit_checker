/**
 * Prayer Performance Card Component
 * Displays current time, daily prayer performance, and Daily Prayer Rewards
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import type { DailyPerformance } from '../../utils/prayerPerformance';
import { formatScore, getStatusMessage } from '../../utils/prayerPerformance';
import { MAX_DAILY_PRAYER_POINTS_SIMPLE } from '../../constants/points';
import { format } from 'date-fns';

interface PrayerPerformanceCardProps {
  performance: DailyPerformance;
}

export const PrayerPerformanceCard: React.FC<PrayerPerformanceCardProps> = ({ performance }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second (optimized for web)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // Calculate performance percentage using daily prayer points
  const performancePercentage = Math.round((performance.dailyPrayerPoints / MAX_DAILY_PRAYER_POINTS_SIMPLE) * 100);

  return (
    <View style={styles.container}>
      {/* Current Time */}
      <View style={styles.timeRow}>
        <Text style={styles.timeIcon}>🕐</Text>
        <Text style={styles.timeText}>{format(currentTime, 'h:mm:ss a')}</Text>
        <Text style={styles.dateText}>{format(currentTime, 'EEEE, MMM d')}</Text>
      </View>

      {/* Performance Metrics */}
      <View style={styles.metricsRow}>
        {/* Score */}
        <View style={styles.metricItem}>
          <View style={[styles.statusBadge, { backgroundColor: performance.color + '20' }]}>
            <Text style={styles.statusIcon}>{performance.icon}</Text>
            <Text style={[styles.statusText, { color: performance.color }]}>
              {getStatusMessage(performance.status)}
            </Text>
          </View>
          <Text style={styles.scoreText}>{formatScore(performance.score)}</Text>
          <Text style={styles.metricLabel}>
            Salah Score ({performance.breakdown.total}/5 logged)
          </Text>
        </View>

        {/* Prayer Rewards */}
        <View style={styles.metricItem}>
          <View style={styles.percentageBadge}>
            <Text style={styles.percentageText}>{performancePercentage}%</Text>
          </View>
          <Text style={styles.rewardScoreText}>{performance.dailyPrayerPoints}/{MAX_DAILY_PRAYER_POINTS_SIMPLE}</Text>
          <Text style={styles.benchmarkText}>Benchmark: {MAX_DAILY_PRAYER_POINTS_SIMPLE}</Text>
          <Text style={styles.metricLabel}>Prayer Rewards</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  timeIcon: {
    fontSize: 16,
    marginRight: theme.spacing.xs,
  },
  timeText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginRight: theme.spacing.sm,
  },
  dateText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.xs,
    gap: 4,
  },
  statusIcon: {
    fontSize: 16,
  },
  statusText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  scoreText: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  percentageBadge: {
    backgroundColor: theme.colors.primary[100],
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.xs,
    alignSelf: 'center',
  },
  percentageText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[700],
  },
  rewardScoreText: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  benchmarkText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  metricLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});

export default PrayerPerformanceCard;
