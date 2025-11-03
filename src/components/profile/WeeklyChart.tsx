/**
 * WeeklyChart Component
 * Displays weekly consistency trend
 *
 * TODO: Update to Victory Native v41+ API or use alternative charting library
 * Victory Native v41 has breaking changes - see: https://commerce.nearform.com/open-source/victory-native/
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { theme } from '../../constants/theme';

interface WeeklyChartProps {
  data: Array<{
    week: string;
    prayers: number;
    quran: number;
    sunnah: number;
    charity: number;
  }>;
}

const { width } = Dimensions.get('window');
const chartWidth = width - 48; // Account for padding

export const WeeklyChart: React.FC<WeeklyChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No data available for the selected period</Text>
      </View>
    );
  }

  // Temporary placeholder until Victory Native v41 migration is complete
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weekly Progress</Text>
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderText}>
          Chart visualization coming soon{'\n'}
          (Victory Native v41 migration in progress)
        </Text>
      </View>

      {/* Display data as text for now */}
      <View style={styles.dataContainer}>
        {data.slice(-4).map((item, index) => (
          <View key={index} style={styles.dataRow}>
            <Text style={styles.weekText}>{item.week}</Text>
            <View style={styles.statsRow}>
              <Text style={styles.stat}>🙏 {item.prayers}</Text>
              <Text style={styles.stat}>📖 {item.quran}</Text>
              <Text style={styles.stat}>✨ {item.sunnah}</Text>
              <Text style={styles.stat}>💚 {item.charity}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.md,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  emptyContainer: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    ...theme.shadows.md,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  placeholderContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  placeholderText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  dataContainer: {
    gap: theme.spacing.sm,
  },
  dataRow: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  weekText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  stat: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
});
