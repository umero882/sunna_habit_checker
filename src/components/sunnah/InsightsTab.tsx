/**
 * InsightsTab Component
 * Analytics, streaks, and milestones for Sunnah habits
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { useSunnahStats } from '../../hooks/useSunnahStats';

export const InsightsTab: React.FC = () => {
  const { stats, isLoading, error, refresh } = useSunnahStats({ days: 30 });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Loading state
  if (isLoading && !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[600]} />
        <Text style={styles.loadingText}>Calculating insights...</Text>
      </View>
    );
  }

  // Error state
  if (error && !stats) {
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
        <Text style={styles.errorTitle}>Unable to Load Insights</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Text style={styles.errorHint}>Pull down to retry</Text>
      </ScrollView>
    );
  }

  if (!stats) {
    return null;
  }

  const { insights, streak, weekly, monthly, milestones } = stats;

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
      {/* Streaks Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Streaks</Text>
        <View style={styles.streaksContainer}>
          {/* Current Streak */}
          <View style={styles.streakCard}>
            <View style={styles.streakIconContainer}>
              <Ionicons name="flame" size={32} color={theme.colors.warning} />
            </View>
            <Text style={styles.streakValue}>{streak.currentStreak}</Text>
            <Text style={styles.streakLabel}>Current Streak</Text>
            <Text style={styles.streakSubtext}>
              {streak.currentStreak === 0
                ? 'Start today!'
                : streak.currentStreak === 1
                ? '1 day'
                : `${streak.currentStreak} days`}
            </Text>
          </View>

          {/* Longest Streak */}
          <View style={styles.streakCard}>
            <View style={styles.streakIconContainer}>
              <Ionicons name="trophy" size={32} color={theme.colors.success} />
            </View>
            <Text style={styles.streakValue}>{streak.longestStreak}</Text>
            <Text style={styles.streakLabel}>Best Streak</Text>
            <Text style={styles.streakSubtext}>
              {streak.longestStreak === 0
                ? 'Not yet'
                : `${streak.longestStreak} day${streak.longestStreak !== 1 ? 's' : ''}`}
            </Text>
          </View>
        </View>
      </View>

      {/* Weekly Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>This Week</Text>
        <View style={styles.weeklyCard}>
          <View style={styles.weeklyHeader}>
            <View style={styles.weeklyProgress}>
              <Text style={styles.weeklyPercentage}>{weekly.completionPercentage}%</Text>
              <Text style={styles.weeklyLabel}>Completion</Text>
            </View>
            <View style={styles.weeklyStats}>
              <Text style={styles.weeklyStatLabel}>Habits Logged</Text>
              <Text style={styles.weeklyStatValue}>
                {weekly.habitsLogged} / {weekly.totalPossible}
              </Text>
            </View>
          </View>

          {/* Level Distribution */}
          <View style={styles.levelDistribution}>
            <Text style={styles.distributionTitle}>Level Distribution</Text>
            <View style={styles.distributionBars}>
              <View style={styles.distributionItem}>
                <View style={styles.distributionBar}>
                  <View
                    style={[
                      styles.distributionBarFill,
                      {
                        width: `${
                          weekly.habitsLogged > 0
                            ? (weekly.levelDistribution.basic / weekly.habitsLogged) * 100
                            : 0
                        }%`,
                        backgroundColor: theme.colors.info,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.distributionLabel}>
                  Basic ({weekly.levelDistribution.basic})
                </Text>
              </View>
              <View style={styles.distributionItem}>
                <View style={styles.distributionBar}>
                  <View
                    style={[
                      styles.distributionBarFill,
                      {
                        width: `${
                          weekly.habitsLogged > 0
                            ? (weekly.levelDistribution.companion / weekly.habitsLogged) * 100
                            : 0
                        }%`,
                        backgroundColor: theme.colors.secondary[600],
                      },
                    ]}
                  />
                </View>
                <Text style={styles.distributionLabel}>
                  Companion ({weekly.levelDistribution.companion})
                </Text>
              </View>
              <View style={styles.distributionItem}>
                <View style={styles.distributionBar}>
                  <View
                    style={[
                      styles.distributionBarFill,
                      {
                        width: `${
                          weekly.habitsLogged > 0
                            ? (weekly.levelDistribution.prophetic / weekly.habitsLogged) * 100
                            : 0
                        }%`,
                        backgroundColor: theme.colors.primary[600],
                      },
                    ]}
                  />
                </View>
                <Text style={styles.distributionLabel}>
                  Prophetic ({weekly.levelDistribution.prophetic})
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Monthly Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>This Month</Text>
        <View style={styles.monthlyCard}>
          <View style={styles.monthlyStats}>
            <View style={styles.monthlyStat}>
              <Text style={styles.monthlyStatValue}>{monthly.completionPercentage}%</Text>
              <Text style={styles.monthlyStatLabel}>Completion</Text>
            </View>
            <View style={styles.monthlyStat}>
              <Text style={styles.monthlyStatValue}>{monthly.averagePerDay}</Text>
              <Text style={styles.monthlyStatLabel}>Avg per Day</Text>
            </View>
            <View style={styles.monthlyStat}>
              <Text style={styles.monthlyStatValue}>{monthly.habitsLogged}</Text>
              <Text style={styles.monthlyStatLabel}>Total Logged</Text>
            </View>
          </View>
          {monthly.favoriteCategory && (
            <View style={styles.favoriteCategoryBox}>
              <Ionicons name="star" size={20} color={theme.colors.warning} />
              <Text style={styles.favoriteCategoryText}>
                Most Active: <Text style={styles.favoriteCategoryName}>{monthly.favoriteCategory}</Text>
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Top Habits */}
      {insights.topHabits.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Habits</Text>
          <Text style={styles.sectionSubtitle}>Your most practiced habits this month</Text>
          <View style={styles.topHabitsList}>
            {insights.topHabits.map((item, index) => (
              <View key={item.habit.id} style={styles.topHabitItem}>
                <View style={styles.topHabitRank}>
                  <Text style={styles.topHabitRankText}>{index + 1}</Text>
                </View>
                <View style={styles.topHabitInfo}>
                  <Text style={styles.topHabitName}>{item.habit.name}</Text>
                  <Text style={styles.topHabitStats}>
                    {item.completionCount} {item.completionCount === 1 ? 'time' : 'times'} •{' '}
                    {item.currentLevel.charAt(0).toUpperCase() + item.currentLevel.slice(1)} level
                  </Text>
                </View>
                <Ionicons
                  name="trophy"
                  size={20}
                  color={
                    index === 0
                      ? '#FFD700'
                      : index === 1
                      ? '#C0C0C0'
                      : index === 2
                      ? '#CD7F32'
                      : theme.colors.text.tertiary
                  }
                />
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Milestones */}
      {milestones.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Milestones</Text>
          <Text style={styles.sectionSubtitle}>Achievements unlocked!</Text>
          <View style={styles.milestonesList}>
            {milestones.slice(0, 5).map(milestone => (
              <View key={milestone.id} style={styles.milestoneItem}>
                <View style={styles.milestoneIcon}>
                  <Ionicons name="ribbon" size={24} color={theme.colors.primary[600]} />
                </View>
                <View style={styles.milestoneInfo}>
                  <Text style={styles.milestoneName}>
                    {milestone.type === 'streak_7'
                      ? '7-Day Streak'
                      : milestone.type === 'streak_30'
                      ? '30-Day Streak'
                      : milestone.type === 'streak_100'
                      ? '100-Day Streak'
                      : milestone.type === 'level_upgrade'
                      ? 'Level Upgrade'
                      : milestone.type === 'category_complete'
                      ? 'Category Completed'
                      : 'First Log'}
                  </Text>
                  <Text style={styles.milestoneDate}>
                    {new Date(milestone.achieved_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Encouragement Card */}
      <View style={styles.encouragementCard}>
        <Text style={styles.encouragementIcon}>💪</Text>
        <Text style={styles.encouragementTitle}>Keep Going!</Text>
        <Text style={styles.encouragementText}>
          {insights.currentStreak > 7
            ? "You're doing amazing! Your consistency is building strong spiritual habits."
            : insights.currentStreak > 0
            ? "Great start! Keep building your streak one day at a time."
            : "Ready to start your journey? Log your first Sunnah habit today!"}
        </Text>
      </View>

      {/* Bottom spacing */}
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
  streaksContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  streakCard: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  streakIconContainer: {
    marginBottom: theme.spacing.sm,
  },
  streakValue: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  streakSubtext: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  weeklyCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  weeklyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  weeklyProgress: {
    alignItems: 'center',
  },
  weeklyPercentage: {
    fontSize: 32,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[600],
    marginBottom: 4,
  },
  weeklyLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  weeklyStats: {
    justifyContent: 'center',
  },
  weeklyStatLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  weeklyStatValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  levelDistribution: {
    marginTop: theme.spacing.md,
  },
  distributionTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  distributionBars: {
    gap: theme.spacing.md,
  },
  distributionItem: {
    gap: theme.spacing.xs,
  },
  distributionBar: {
    height: 8,
    backgroundColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  distributionBarFill: {
    height: '100%',
    borderRadius: theme.borderRadius.full,
  },
  distributionLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  monthlyCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  monthlyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.md,
  },
  monthlyStat: {
    alignItems: 'center',
  },
  monthlyStatValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  monthlyStatLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  favoriteCategoryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  favoriteCategoryText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  favoriteCategoryName: {
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  topHabitsList: {
    gap: theme.spacing.sm,
  },
  topHabitItem: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    ...theme.shadows.sm,
  },
  topHabitRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  topHabitRankText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.background.primary,
  },
  topHabitInfo: {
    flex: 1,
  },
  topHabitName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  topHabitStats: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  milestonesList: {
    gap: theme.spacing.sm,
  },
  milestoneItem: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    ...theme.shadows.sm,
  },
  milestoneIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: `${theme.colors.primary[600]}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  milestoneDate: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  encouragementCard: {
    backgroundColor: `${theme.colors.primary[600]}15`,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  encouragementIcon: {
    fontSize: 40,
    marginBottom: theme.spacing.sm,
  },
  encouragementTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[600],
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  encouragementText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: theme.spacing.xl,
  },
});

export default InsightsTab;
