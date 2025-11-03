/**
 * TodayTab Component
 * Shows today's recommended Sunnah habits with daily progress
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../../constants/theme';
import { useSunnahHabits } from '../../hooks/useSunnahHabits';
import { SunnahCard } from './SunnahCard';
import type { SunnahLevel } from '../../types';

import { createLogger } from '../../utils/logger';

const logger = createLogger('TodayTab');

export interface TodayTabProps {
  onHabitLogged?: () => void;
}

export const TodayTab: React.FC<TodayTabProps> = ({ onHabitLogged }) => {
  const {
    recommendedHabits,
    habits: allHabits,
    isLoading,
    error,
    logHabit,
    pinHabit,
    unpinHabit,
    refresh,
  } = useSunnahHabits({ autoLoad: false });

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load data on mount
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Calculate daily progress
  const completedCount = recommendedHabits.filter(h => h.todayLog).length;
  const totalCount = recommendedHabits.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Handle habit logging
  const handleLog = useCallback(
    async (habitId: string, level: SunnahLevel, reflection?: string) => {
      try {
        await logHabit(habitId, level, reflection);
        onHabitLogged?.();
      } catch (err) {
        logger.error('Error logging habit:', err);
      }
    },
    [logHabit, onHabitLogged]
  );

  const handlePin = useCallback(
    async (habitId: string) => {
      try {
        await pinHabit(habitId);
      } catch (err) {
        logger.error('Error pinning habit:', err);
      }
    },
    [pinHabit]
  );

  const handleUnpin = useCallback(
    async (habitId: string) => {
      try {
        await unpinHabit(habitId);
      } catch (err) {
        logger.error('Error unpinning habit:', err);
      }
    },
    [unpinHabit]
  );

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh]);

  // Loading state
  if (isLoading && recommendedHabits.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[600]} />
        <Text style={styles.loadingText}>Loading today's habits...</Text>
      </View>
    );
  }

  // Error state
  if (error && recommendedHabits.length === 0) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.errorContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary[600]}
          />
        }
      >
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Unable to Load Habits</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Text style={styles.errorHint}>Pull down to retry</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={theme.colors.primary[600]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Progress Summary */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <View>
            <Text style={styles.progressTitle}>Today's Progress</Text>
            <Text style={styles.progressSubtitle}>
              {completedCount} of {totalCount} habits completed
            </Text>
          </View>
          <View style={styles.percentageCircle}>
            <Text style={styles.percentageText}>{completionPercentage}%</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${completionPercentage}%`,
                backgroundColor:
                  completionPercentage === 100 ? theme.colors.success : theme.colors.primary[600],
              },
            ]}
          />
        </View>

        {/* Completion Message */}
        {completionPercentage === 100 && (
          <View style={styles.completionMessage}>
            <Text style={styles.completionEmoji}>🎉</Text>
            <Text style={styles.completionText}>
              Excellent! You've completed all recommended habits today!
            </Text>
          </View>
        )}
      </View>

      {/* Recommended Habits Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Recommended Habits</Text>
        <Text style={styles.sectionSubtitle}>
          {completedCount === 0
            ? 'Start your day by logging these Sunnah practices'
            : completionPercentage === 100
              ? 'All done for today! Keep up the good work'
              : `${totalCount - completedCount} more to go`}
        </Text>

        {recommendedHabits.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📋</Text>
            <Text style={styles.emptyStateTitle}>No Habits Yet</Text>
            <Text style={styles.emptyStateText}>
              Add some habits to your routine to get daily recommendations
            </Text>
          </View>
        ) : (
          <View style={styles.habitsList}>
            {recommendedHabits.map(habit => (
              <SunnahCard
                key={habit.id}
                habit={habit}
                onLog={handleLog}
                onPin={handlePin}
                onUnpin={handleUnpin}
              />
            ))}
          </View>
        )}
      </View>

      {/* Additional Habits (if available) */}
      {allHabits.length > recommendedHabits.length && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>More Habits</Text>
          <Text style={styles.sectionSubtitle}>
            Explore additional Sunnah practices when you're ready
          </Text>
          <View style={styles.habitsList}>
            {allHabits
              .filter(h => !recommendedHabits.find(rh => rh.id === h.id) && !h.todayLog)
              .slice(0, 3)
              .map(habit => (
                <SunnahCard
                  key={habit.id}
                  habit={habit}
                  onLog={handleLog}
                  onPin={handlePin}
                  onUnpin={handleUnpin}
                  compact
                />
              ))}
          </View>
        </View>
      )}

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  contentContainer: {
    padding: theme.spacing.md,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  errorTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  errorHint: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  progressCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  progressTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  percentageCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${theme.colors.primary[600]}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[600],
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: theme.borderRadius.full,
  },
  completionMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: `${theme.colors.success}15`,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  completionEmoji: {
    fontSize: 24,
  },
  completionText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.success,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  habitsList: {
    gap: 0, // SunnahCard has its own marginBottom
  },
  emptyState: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyStateTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: theme.spacing.xl,
  },
});

export default TodayTab;
