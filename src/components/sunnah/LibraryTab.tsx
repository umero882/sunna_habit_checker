/**
 * LibraryTab Component
 * Browse all Sunnah habits organized by categories
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { useSunnahHabits } from '../../hooks/useSunnahHabits';
import { SunnahCard } from './SunnahCard';
import type { SunnahLevel, SunnahCategoryName } from '../../types';

import { createLogger } from '../../utils/logger';

const logger = createLogger('LibraryTab');

const CATEGORY_ICONS: Record<SunnahCategoryName, string> = {
  Prayer: 'moon',
  Dhikr: 'sparkles',
  Charity: 'heart',
  Quran: 'book',
  Fasting: 'sunny',
  Lifestyle: 'leaf',
  Social: 'people',
};

export const LibraryTab: React.FC = () => {
  const { habits, categories, isLoading, error, logHabit, pinHabit, unpinHabit, refresh } =
    useSunnahHabits({ autoLoad: false });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh]);

  const handleLog = useCallback(
    async (habitId: string, level: SunnahLevel, reflection?: string) => {
      try {
        await logHabit(habitId, level, reflection);
      } catch (err) {
        logger.error('Error logging habit:', err);
      }
    },
    [logHabit]
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

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
  };

  // Filter habits by selected category
  const filteredHabits = selectedCategory
    ? habits.filter(h => h.category_id === selectedCategory)
    : habits;

  // Group habits by category for display
  const habitsByCategory = categories.map(category => ({
    category,
    habits: habits.filter(h => h.category_id === category.id),
  }));

  // Loading state
  if (isLoading && habits.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[600]} />
        <Text style={styles.loadingText}>Loading habit library...</Text>
      </View>
    );
  }

  // Error state
  if (error && habits.length === 0) {
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
        <Text style={styles.errorTitle}>Unable to Load Library</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Text style={styles.errorHint}>Pull down to retry</Text>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Category Filter */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {/* All Categories */}
          <TouchableOpacity
            style={[styles.categoryChip, selectedCategory === null && styles.categoryChipActive]}
            onPress={() => handleCategorySelect(null)}
          >
            <Ionicons
              name="apps"
              size={18}
              color={
                selectedCategory === null
                  ? theme.colors.background.primary
                  : theme.colors.text.secondary
              }
            />
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === null && styles.categoryChipTextActive,
              ]}
            >
              All ({habits.length})
            </Text>
          </TouchableOpacity>

          {/* Individual Categories */}
          {categories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.categoryChipActive,
              ]}
              onPress={() => handleCategorySelect(category.id)}
            >
              <Ionicons
                name={CATEGORY_ICONS[category.name] as any}
                size={18}
                color={
                  selectedCategory === category.id
                    ? theme.colors.background.primary
                    : theme.colors.text.secondary
                }
              />
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === category.id && styles.categoryChipTextActive,
                ]}
              >
                {category.name} ({habits.filter(h => h.category_id === category.id).length})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Habits List */}
      <ScrollView
        style={styles.scrollView}
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
        {selectedCategory ? (
          // Single category view
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {categories.find(c => c.id === selectedCategory)?.name} Habits
            </Text>
            <Text style={styles.sectionSubtitle}>
              {filteredHabits.length} habit{filteredHabits.length !== 1 ? 's' : ''} in this category
            </Text>
            <View style={styles.habitsList}>
              {filteredHabits.map(habit => (
                <SunnahCard
                  key={habit.id}
                  habit={habit}
                  onLog={handleLog}
                  onPin={handlePin}
                  onUnpin={handleUnpin}
                />
              ))}
            </View>
          </View>
        ) : (
          // All categories view
          habitsByCategory.map(({ category, habits: categoryHabits }) => (
            <View key={category.id} style={styles.section}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryIconContainer}>
                  <Ionicons
                    name={CATEGORY_ICONS[category.name] as any}
                    size={24}
                    color={theme.colors.primary[600]}
                  />
                </View>
                <View style={styles.categoryHeaderText}>
                  <Text style={styles.sectionTitle}>{category.name}</Text>
                  <Text style={styles.sectionSubtitle}>
                    {categoryHabits.length} habit{categoryHabits.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.habitsList}>
                {categoryHabits.slice(0, 3).map(habit => (
                  <SunnahCard
                    key={habit.id}
                    habit={habit}
                    onLog={handleLog}
                    onPin={handlePin}
                    onUnpin={handleUnpin}
                  />
                ))}
              </View>
              {categoryHabits.length > 3 && (
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => handleCategorySelect(category.id)}
                >
                  <Text style={styles.viewAllText}>View all {categoryHabits.length} habits</Text>
                  <Ionicons name="chevron-forward" size={16} color={theme.colors.primary[600]} />
                </TouchableOpacity>
              )}
            </View>
          ))
        )}

        {/* Empty state */}
        {filteredHabits.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📚</Text>
            <Text style={styles.emptyStateTitle}>No Habits Found</Text>
            <Text style={styles.emptyStateText}>There are no habits in this category yet.</Text>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
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
  filterSection: {
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  filterScrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    gap: theme.spacing.xs,
  },
  categoryChipActive: {
    backgroundColor: theme.colors.primary[600],
    borderColor: theme.colors.primary[600],
  },
  categoryChipText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
  },
  categoryChipTextActive: {
    color: theme.colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: `${theme.colors.primary[600]}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  habitsList: {
    gap: 0, // SunnahCard has its own marginBottom
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  viewAllText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary[600],
  },
  emptyState: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
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

export default LibraryTab;
