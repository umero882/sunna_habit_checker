/**
 * PlannerTab Component
 * Main tab for managing reading plans
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { theme } from '../../../constants/theme';
import { useReadingPlan } from '../../../hooks/useReadingPlan';
import { PlanCard } from './PlanCard';
import { CreatePlanModal } from './CreatePlanModal';
import { QuranPlan } from '../../../types';

interface PlannerTabProps {
  userId?: string;
}

export const PlannerTab: React.FC<PlannerTabProps> = ({ userId }) => {
  const { activePlan, plans, isLoading, error, createPlan, updatePlan, deletePlan } =
    useReadingPlan(userId);

  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleCreatePlan = async (planData: any) => {
    try {
      await createPlan(planData);
    } catch (error) {
      Alert.alert('Error', 'Failed to create plan. Please try again.');
    }
  };

  const handleDeletePlan = (plan: QuranPlan) => {
    Alert.alert('Delete Plan', `Are you sure you want to delete "${plan.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePlan(plan.id);
          } catch (error) {
            Alert.alert('Error', 'Failed to delete plan. Please try again.');
          }
        },
      },
    ]);
  };

  const handleToggleActive = async (plan: QuranPlan) => {
    try {
      // Deactivate current active plan
      if (activePlan) {
        await updatePlan(activePlan.id, { active: false });
      }
      // Activate selected plan
      await updatePlan(plan.id, { active: true });
    } catch (error) {
      Alert.alert('Error', 'Failed to update plan. Please try again.');
    }
  };

  if (!userId) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🔒</Text>
        <Text style={styles.emptyTitle}>Sign in Required</Text>
        <Text style={styles.emptyText}>Please sign in to create and manage reading plans</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[600]} />
        <Text style={styles.loadingText}>Loading plans...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>⚠️</Text>
        <Text style={styles.emptyTitle}>Error Loading Plans</Text>
        <Text style={styles.emptyText}>{error.message}</Text>
      </View>
    );
  }

  const activePlans = plans.filter(p => p.active && !p.completed_at);
  const completedPlans = plans.filter(p => p.completed_at);
  const inactivePlans = plans.filter(p => !p.active && !p.completed_at);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Reading Plans</Text>
            <Text style={styles.headerSubtitle}>
              {plans.length === 0
                ? 'Create your first plan to get started'
                : `${plans.length} plan${plans.length !== 1 ? 's' : ''} total`}
            </Text>
          </View>
          <TouchableOpacity style={styles.createButton} onPress={() => setIsModalVisible(true)}>
            <Text style={styles.createButtonIcon}>+</Text>
          </TouchableOpacity>
        </View>

        {plans.length === 0 ? (
          // Empty State
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📚</Text>
            <Text style={styles.emptyStateTitle}>No Reading Plans Yet</Text>
            <Text style={styles.emptyStateText}>
              Create a plan to track your Qur'an reading progress and stay motivated on your
              spiritual journey.
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => setIsModalVisible(true)}
            >
              <Text style={styles.emptyStateButtonText}>Create Your First Plan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Active Plans */}
            {activePlans.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Active Plan</Text>
                {activePlans.map(plan => (
                  <PlanCard key={plan.id} plan={plan} onDelete={() => handleDeletePlan(plan)} />
                ))}
              </View>
            )}

            {/* Inactive Plans */}
            {inactivePlans.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Inactive Plans</Text>
                {inactivePlans.map(plan => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onDelete={() => handleDeletePlan(plan)}
                    onToggleActive={() => handleToggleActive(plan)}
                  />
                ))}
              </View>
            )}

            {/* Completed Plans */}
            {completedPlans.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Completed Plans ({completedPlans.length})</Text>
                {completedPlans.map(plan => (
                  <PlanCard key={plan.id} plan={plan} onDelete={() => handleDeletePlan(plan)} />
                ))}
              </View>
            )}
          </>
        )}

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💡 Reading Tips</Text>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>Start with small, achievable daily targets</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>Read with understanding - quality over quantity</Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>Choose a consistent time each day for reading</Text>
          </View>
        </View>
      </ScrollView>

      {/* Create Plan Modal */}
      <CreatePlanModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onCreate={handleCreatePlan}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl * 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  createButtonIcon: {
    fontSize: theme.typography.fontSize.xxl,
    color: theme.colors.text.inverse,
    fontWeight: theme.typography.fontWeight.bold,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  emptyStateTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    lineHeight: 24,
  },
  emptyStateButton: {
    backgroundColor: theme.colors.primary[600],
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  },
  emptyStateButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
  },
  tipsSection: {
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.xl,
  },
  tipsTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xs,
  },
  tipBullet: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.primary[600],
    marginRight: theme.spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});

export default PlannerTab;
