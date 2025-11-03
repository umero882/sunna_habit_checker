/**
 * ProgressSummary Component
 * Combines weekly trend chart and tier distribution chart with key metrics
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '../../constants/theme';
import { useProgressSnapshots } from '../../hooks/useProgressSnapshots';
import { WeeklyChart } from './WeeklyChart';
import { TierPieChart } from './TierPieChart';

export const ProgressSummary: React.FC = () => {
  const { weeklyTrend, latestLevelDistribution, aggregateStats, isLoading, error } =
    useProgressSnapshots(8);

  // Don't show loading spinner forever - max 3 seconds
  const [showContent, setShowContent] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading && !showContent) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[600]} />
        <Text style={styles.loadingText}>Loading progress data...</Text>
      </View>
    );
  }

  // If there's an error or no data, show empty state
  if (error || !weeklyTrend || weeklyTrend.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No progress data yet</Text>
        <Text style={styles.emptySubtext}>
          Start logging your habits to see your progress here!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Key Metrics Cards */}
      {aggregateStats && (
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{aggregateStats.avgPrayersPerWeek}</Text>
            <Text style={styles.metricLabel}>Avg Prayers/Week</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              {Math.round(aggregateStats.avgQuranMinutesPerWeek / 60)}h
            </Text>
            <Text style={styles.metricLabel}>Avg Quran/Week</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{aggregateStats.totalSunnahCompleted}</Text>
            <Text style={styles.metricLabel}>Sunnah Habits</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{aggregateStats.totalCharityEntries}</Text>
            <Text style={styles.metricLabel}>Charity Entries</Text>
          </View>
        </View>
      )}

      {/* Weekly Trend Chart */}
      <View style={styles.chartSection}>
        <WeeklyChart data={weeklyTrend} />
      </View>

      {/* Tier Distribution */}
      <View style={styles.chartSection}>
        <TierPieChart distribution={latestLevelDistribution} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  loadingContainer: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  metricCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: theme.colors.primary[50],
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary[600],
  },
  metricValue: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[700],
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  chartSection: {
    marginBottom: theme.spacing.md,
  },
  emptyContainer: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
});
