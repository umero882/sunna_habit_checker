/**
 * Friday Sunnah Checklist Component
 * Interactive checklist for tracking Friday Sunnah practices
 * Appears when logging Jumu'ah prayer with Jamaah
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { theme } from '../../constants/theme';
import { FRIDAY_SUNNAH_ITEMS, calculateFridaySunnahPercentage } from '../../constants/hadith';

interface FridaySunnahChecklistProps {
  visible: boolean;
  onComplete: (completedItems: string[]) => void;
  onCancel: () => void;
  initialCompletedItems?: string[];
}

export const FridaySunnahChecklist: React.FC<FridaySunnahChecklistProps> = ({
  visible,
  onComplete,
  onCancel,
  initialCompletedItems = [],
}) => {
  const [completedItems, setCompletedItems] = useState<string[]>(initialCompletedItems);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const toggleItem = (itemId: string) => {
    setCompletedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleExpand = (itemId: string) => {
    setExpandedItem((prev) => (prev === itemId ? null : itemId));
  };

  const handleSubmit = () => {
    onComplete(completedItems);
  };

  const completionPercentage = calculateFridaySunnahPercentage(completedItems);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerIcon}>🕌</Text>
            <Text style={styles.title}>Friday Blessings Checklist</Text>
            <Text style={styles.subtitle}>
              Which Sunnah practices did you complete today?
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${completionPercentage}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {completedItems.length}/{FRIDAY_SUNNAH_ITEMS.length} completed ({completionPercentage}%)
            </Text>
          </View>

          {/* Checklist Items */}
          <ScrollView
            style={styles.checklistContainer}
            contentContainerStyle={styles.checklistContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {FRIDAY_SUNNAH_ITEMS.map((item) => {
              const isChecked = completedItems.includes(item.id);
              const isExpanded = expandedItem === item.id;

              return (
                <View key={item.id} style={styles.itemContainer}>
                  {/* Checkbox and Title */}
                  <TouchableOpacity
                    style={[
                      styles.checkboxRow,
                      isChecked && styles.checkboxRowChecked,
                    ]}
                    onPress={() => toggleItem(item.id)}
                  >
                    <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                      {isChecked && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <View style={styles.itemContent}>
                      <View style={styles.itemTitleRow}>
                        <Text style={styles.itemIcon}>{item.icon}</Text>
                        <Text style={[styles.itemTitle, isChecked && styles.itemTitleChecked]}>
                          {item.title}
                        </Text>
                      </View>
                      <Text style={styles.itemDescription}>{item.description}</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Expand Button */}
                  <TouchableOpacity
                    style={styles.expandButton}
                    onPress={() => toggleExpand(item.id)}
                  >
                    <Text style={styles.expandIcon}>
                      {isExpanded ? '▼' : '▶'}
                    </Text>
                    <Text style={styles.expandText}>
                      {isExpanded ? 'Hide' : 'Show'} Hadith
                    </Text>
                  </TouchableOpacity>

                  {/* Expanded Hadith Details */}
                  {isExpanded && (
                    <View style={styles.hadithContainer}>
                      <Text style={styles.hadithText}>{item.hadith.textEnglish}</Text>

                      {item.hadith.reward && (
                        <View style={styles.rewardBadge}>
                          <Text style={styles.rewardIcon}>✨</Text>
                          <Text style={styles.rewardText}>{item.hadith.reward}</Text>
                        </View>
                      )}

                      <View style={styles.sourceContainer}>
                        <Text style={styles.sourceIcon}>📚</Text>
                        <Text style={styles.sourceText}>
                          {item.hadith.source} {item.hadith.reference && `(${item.hadith.reference})`}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitButton,
                completedItems.length === 0 && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={completedItems.length === 0}
            >
              <Text style={styles.submitButtonText}>
                {completedItems.length === 0 ? 'Select at least one' : 'Complete'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  modalContainer: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.xl,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    overflow: 'hidden',
    ...theme.shadows.lg,
  },
  header: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  progressContainer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary[600],
    borderRadius: theme.borderRadius.full,
  },
  progressText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontWeight: theme.typography.fontWeight.medium,
  },
  checklistContainer: {
    flexGrow: 1,
    flexShrink: 1,
  },
  checklistContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  itemContainer: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.md,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  checkboxRowChecked: {
    opacity: 0.8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 2,
    borderColor: theme.colors.gray[400],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary[600],
    borderColor: theme.colors.primary[600],
  },
  checkmark: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: theme.typography.fontWeight.bold,
  },
  itemContent: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: 4,
  },
  itemIcon: {
    fontSize: 20,
  },
  itemTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    flex: 1,
  },
  itemTitleChecked: {
    textDecorationLine: 'line-through',
    color: theme.colors.text.secondary,
  },
  itemDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  expandIcon: {
    fontSize: 10,
    color: theme.colors.primary[600],
  },
  expandText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeight.medium,
  },
  hadithContainer: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary[600],
  },
  hadithText: {
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 20,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.primary[100],
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  rewardIcon: {
    fontSize: 14,
  },
  rewardText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary[700],
    fontWeight: theme.typography.fontWeight.semibold,
    flex: 1,
  },
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  sourceIcon: {
    fontSize: 12,
  },
  sourceText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeight.medium,
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  cancelButton: {
    flex: 1,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.gray[200],
  },
  cancelButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  submitButton: {
    flex: 1,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary[600],
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.gray[300],
  },
  submitButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.white,
  },
});

export default FridaySunnahChecklist;
