/**
 * TierPieChart Component
 * Displays Sunnah habit distribution across three levels
 *
 * TODO: Update to Victory Native v41+ API or use alternative charting library
 * Victory Native v41 has breaking changes - see: https://commerce.nearform.com/open-source/victory-native/
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { theme } from '../../constants/theme';

interface TierPieChartProps {
  distribution: {
    basic: number;
    companion: number;
    prophetic: number;
  };
}

const { width } = Dimensions.get('window');
const chartSize = Math.min(width - 96, 200);

export const TierPieChart: React.FC<TierPieChartProps> = ({ distribution }) => {
  const total = distribution.basic + distribution.companion + distribution.prophetic;

  if (total === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No Sunnah data yet</Text>
      </View>
    );
  }

  const basicPercent = Math.round((distribution.basic / total) * 100);
  const companionPercent = Math.round((distribution.companion / total) * 100);
  const propheticPercent = Math.round((distribution.prophetic / total) * 100);

  // Temporary text-based visualization until Victory Native v41 migration
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sunnah Distribution</Text>

      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderText}>
          Chart visualization coming soon{'\n'}
          (Victory Native v41 migration in progress)
        </Text>
      </View>

      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.colorBox, { backgroundColor: theme.colors.primary[300] }]} />
          <View style={styles.legendTextContainer}>
            <Text style={styles.legendLabel}>Basic Sunnah</Text>
            <Text style={styles.legendValue}>{distribution.basic} ({basicPercent}%)</Text>
          </View>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.colorBox, { backgroundColor: theme.colors.primary[500] }]} />
          <View style={styles.legendTextContainer}>
            <Text style={styles.legendLabel}>Companion Level</Text>
            <Text style={styles.legendValue}>{distribution.companion} ({companionPercent}%)</Text>
          </View>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.colorBox, { backgroundColor: theme.colors.primary[700] }]} />
          <View style={styles.legendTextContainer}>
            <Text style={styles.legendLabel}>Prophetic Level</Text>
            <Text style={styles.legendValue}>{distribution.prophetic} ({propheticPercent}%)</Text>
          </View>
        </View>
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
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    alignSelf: 'flex-start',
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
    width: chartSize,
    height: chartSize,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: chartSize / 2,
    marginBottom: theme.spacing.md,
  },
  placeholderText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  legendContainer: {
    width: '100%',
    gap: theme.spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  colorBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendTextContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
  },
  legendValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
  },
});
