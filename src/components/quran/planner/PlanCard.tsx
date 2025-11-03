/**
 * PlanCard Component
 * Displays a reading plan with progress
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../../constants/theme';
import { QuranPlan } from '../../../types';
import { format } from 'date-fns';

interface PlanCardProps {
  plan: QuranPlan;
  onPress?: () => void;
  onDelete?: () => void;
  onToggleActive?: () => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  onPress,
  onDelete,
  onToggleActive,
}) => {
  const getModeLabel = (mode: string): string => {
    switch (mode) {
      case 'pages':
        return 'Pages';
      case 'verses':
        return 'Verses';
      case 'time':
        return 'Minutes';
      default:
        return mode;
    }
  };

  const getProgressPercentage = (): number => {
    if (!plan.total_target) return 0;
    return Math.min((plan.completed / plan.total_target) * 100, 100);
  };

  const progressPercentage = getProgressPercentage();
  const isComplete = plan.completed_at !== null;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        plan.active && styles.activeContainer,
        isComplete && styles.completedContainer,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.name}>{plan.name}</Text>
          {plan.active && !isComplete && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Active</Text>
            </View>
          )}
          {isComplete && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedBadgeText}>✓ Completed</Text>
            </View>
          )}
        </View>
      </View>

      {/* Target Info */}
      <View style={styles.targetContainer}>
        <View style={styles.targetRow}>
          <Text style={styles.targetLabel}>Daily Target:</Text>
          <Text style={styles.targetValue}>
            {plan.target_per_day} {getModeLabel(plan.mode)}/day
          </Text>
        </View>
        {plan.total_target && (
          <View style={styles.targetRow}>
            <Text style={styles.targetLabel}>Total Goal:</Text>
            <Text style={styles.targetValue}>
              {plan.total_target} {getModeLabel(plan.mode)}
            </Text>
          </View>
        )}
      </View>

      {/* Progress Bar */}
      {plan.total_target && (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>
              {plan.completed} / {plan.total_target}
            </Text>
            <Text style={styles.progressPercentage}>
              {Math.round(progressPercentage)}%
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercentage}%` },
                isComplete && styles.progressBarComplete,
              ]}
            />
          </View>
        </View>
      )}

      {/* Dates */}
      <View style={styles.datesContainer}>
        <Text style={styles.dateText}>
          Started: {format(new Date(plan.started_at), 'MMM dd, yyyy')}
        </Text>
        {isComplete && plan.completed_at && (
          <Text style={styles.dateText}>
            Completed: {format(new Date(plan.completed_at), 'MMM dd, yyyy')}
          </Text>
        )}
      </View>

      {/* Actions */}
      {!isComplete && (
        <View style={styles.actionsContainer}>
          {!plan.active && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                onToggleActive?.();
              }}
            >
              <Text style={styles.actionButtonText}>Set Active</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
          >
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  activeContainer: {
    borderWidth: 2,
    borderColor: theme.colors.primary[600],
  },
  completedContainer: {
    opacity: 0.8,
    borderWidth: 2,
    borderColor: theme.colors.success,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  name: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    flex: 1,
  },
  activeBadge: {
    backgroundColor: theme.colors.primary[100],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  activeBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary[700],
  },
  completedBadge: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  completedBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
  },
  targetContainer: {
    marginBottom: theme.spacing.md,
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  targetLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  targetValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  progressSection: {
    marginBottom: theme.spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  progressText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  progressPercentage: {
    fontSize: theme.typography.fontSize.sm,
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
    backgroundColor: theme.colors.primary[600],
    borderRadius: theme.borderRadius.full,
  },
  progressBarComplete: {
    backgroundColor: theme.colors.success,
  },
  datesContainer: {
    marginBottom: theme.spacing.sm,
  },
  dateText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginBottom: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    backgroundColor: theme.colors.primary[100],
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary[700],
  },
  deleteButton: {
    backgroundColor: theme.colors.feedback.errorLight,
  },
  deleteButtonText: {
    color: theme.colors.feedback.error,
  },
});

export default PlanCard;
