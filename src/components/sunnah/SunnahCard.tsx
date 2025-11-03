/**
 * SunnahCard Component
 * Displays a single Sunnah habit with 3-tier benchmark selection
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import type { SunnahHabitWithLog, SunnahLevel } from '../../types';

export interface SunnahCardProps {
  habit: SunnahHabitWithLog;
  onLog: (habitId: string, level: SunnahLevel, reflection?: string) => void;
  onPin?: (habitId: string) => void;
  onUnpin?: (habitId: string) => void;
  compact?: boolean;
}

const LEVEL_COLORS = {
  basic: theme.colors.info,
  companion: theme.colors.secondary[600],
  prophetic: theme.colors.primary[600],
};

const LEVEL_LABELS = {
  basic: 'Basic',
  companion: 'Companion',
  prophetic: 'Prophetic',
};

export const SunnahCard: React.FC<SunnahCardProps> = ({
  habit,
  onLog,
  onPin,
  onUnpin,
  compact = false,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<SunnahLevel | null>(null);

  const isLogged = !!habit.todayLog;
  const currentLevel = habit.todayLog?.level;

  const handleLevelSelect = (level: SunnahLevel) => {
    setSelectedLevel(level);
  };

  const handleConfirm = () => {
    if (selectedLevel) {
      onLog(habit.id, selectedLevel);
      setShowModal(false);
      setSelectedLevel(null);
    }
  };

  const handleCardPress = () => {
    if (!isLogged) {
      setShowModal(true);
    }
  };

  const handlePinToggle = (e: any) => {
    e.stopPropagation(); // Prevent card press
    if (habit.isPinned && onUnpin) {
      onUnpin(habit.id);
    } else if (!habit.isPinned && onPin) {
      onPin(habit.id);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.card,
          isLogged && styles.cardLogged,
          isLogged && { borderLeftColor: LEVEL_COLORS[currentLevel!] },
        ]}
        onPress={handleCardPress}
        activeOpacity={0.7}
      >
        {/* Icon & Title */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{habit.icon || '✨'}</Text>
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {habit.name}
            </Text>
            <Text style={styles.category} numberOfLines={1}>
              {habit.category.name}
            </Text>
          </View>

          {/* Pin Button */}
          {(onPin || onUnpin) && (
            <TouchableOpacity
              style={styles.pinButton}
              onPress={handlePinToggle}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={habit.isPinned ? "pin" : "pin-outline"}
                size={20}
                color={habit.isPinned ? theme.colors.secondary[600] : theme.colors.text.tertiary}
              />
            </TouchableOpacity>
          )}

          {isLogged && (
            <View
              style={[
                styles.completeBadge,
                { backgroundColor: LEVEL_COLORS[currentLevel!] },
              ]}
            >
              <Ionicons name="checkmark" size={16} color="white" />
            </View>
          )}
        </View>

        {/* Description */}
        {!compact && (
          <Text style={styles.description} numberOfLines={2}>
            {habit.description}
          </Text>
        )}

        {/* Current Level Display */}
        {isLogged && (
          <View style={styles.levelDisplay}>
            <View
              style={[
                styles.levelBadge,
                { backgroundColor: `${LEVEL_COLORS[currentLevel!]}15` },
              ]}
            >
              <Text style={[styles.levelText, { color: LEVEL_COLORS[currentLevel!] }]}>
                {LEVEL_LABELS[currentLevel!]} Level
              </Text>
            </View>
            {habit.currentStreak > 0 && (
              <View style={styles.streakBadge}>
                <Ionicons name="flame" size={14} color={theme.colors.warning} />
                <Text style={styles.streakText}>{habit.currentStreak} day streak</Text>
              </View>
            )}
          </View>
        )}

        {/* Action Hint */}
        {!isLogged && (
          <View style={styles.actionHint}>
            <Text style={styles.actionHintText}>Tap to log</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.text.tertiary} />
          </View>
        )}
      </TouchableOpacity>

      {/* Level Selection Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowModal(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalIconContainer}>
                  <Text style={styles.modalIcon}>{habit.icon || '✨'}</Text>
                </View>
                <Text style={styles.modalTitle}>{habit.name}</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowModal(false)}
                >
                  <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              </View>

              {/* Description */}
              <View style={styles.modalSection}>
                <Text style={styles.modalDescription}>{habit.description}</Text>
              </View>

              {/* Source */}
              <View style={styles.sourceContainer}>
                <Ionicons name="book-outline" size={16} color={theme.colors.text.tertiary} />
                <Text style={styles.sourceText}>{habit.source}</Text>
              </View>

              {/* Level Selection */}
              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>Select Your Level</Text>

                {/* Basic Level */}
                <TouchableOpacity
                  style={[
                    styles.levelOption,
                    { borderColor: LEVEL_COLORS.basic },
                    selectedLevel === 'basic' && {
                      backgroundColor: `${LEVEL_COLORS.basic}15`,
                    },
                  ]}
                  onPress={() => handleLevelSelect('basic')}
                >
                  <View style={styles.levelOptionHeader}>
                    <View
                      style={[styles.levelDot, { backgroundColor: LEVEL_COLORS.basic }]}
                    />
                    <Text
                      style={[styles.levelOptionTitle, { color: LEVEL_COLORS.basic }]}
                    >
                      Basic Level
                    </Text>
                    {selectedLevel === 'basic' && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={LEVEL_COLORS.basic}
                      />
                    )}
                  </View>
                  <Text style={styles.levelOptionDescription}>{habit.tier_basic}</Text>
                </TouchableOpacity>

                {/* Companion Level */}
                <TouchableOpacity
                  style={[
                    styles.levelOption,
                    { borderColor: LEVEL_COLORS.companion },
                    selectedLevel === 'companion' && {
                      backgroundColor: `${LEVEL_COLORS.companion}15`,
                    },
                  ]}
                  onPress={() => handleLevelSelect('companion')}
                >
                  <View style={styles.levelOptionHeader}>
                    <View
                      style={[styles.levelDot, { backgroundColor: LEVEL_COLORS.companion }]}
                    />
                    <Text
                      style={[
                        styles.levelOptionTitle,
                        { color: LEVEL_COLORS.companion },
                      ]}
                    >
                      Companion Level
                    </Text>
                    {selectedLevel === 'companion' && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={LEVEL_COLORS.companion}
                      />
                    )}
                  </View>
                  <Text style={styles.levelOptionDescription}>
                    {habit.tier_companion}
                  </Text>
                </TouchableOpacity>

                {/* Prophetic Level */}
                <TouchableOpacity
                  style={[
                    styles.levelOption,
                    { borderColor: LEVEL_COLORS.prophetic },
                    selectedLevel === 'prophetic' && {
                      backgroundColor: `${LEVEL_COLORS.prophetic}15`,
                    },
                  ]}
                  onPress={() => handleLevelSelect('prophetic')}
                >
                  <View style={styles.levelOptionHeader}>
                    <View
                      style={[styles.levelDot, { backgroundColor: LEVEL_COLORS.prophetic }]}
                    />
                    <Text
                      style={[
                        styles.levelOptionTitle,
                        { color: LEVEL_COLORS.prophetic },
                      ]}
                    >
                      Prophetic Level
                    </Text>
                    {selectedLevel === 'prophetic' && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={LEVEL_COLORS.prophetic}
                      />
                    )}
                  </View>
                  <Text style={styles.levelOptionDescription}>
                    {habit.tier_prophetic}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Benefits */}
              {habit.benefits && habit.benefits.length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Benefits</Text>
                  {habit.benefits.map((benefit, index) => (
                    <View key={index} style={styles.benefitItem}>
                      <Ionicons
                        name="star"
                        size={14}
                        color={theme.colors.warning}
                        style={styles.benefitIcon}
                      />
                      <Text style={styles.benefitText}>{benefit}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Confirm Button */}
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  !selectedLevel && styles.confirmButtonDisabled,
                  selectedLevel && {
                    backgroundColor: LEVEL_COLORS[selectedLevel],
                  },
                ]}
                onPress={handleConfirm}
                disabled={!selectedLevel}
              >
                <Text style={styles.confirmButtonText}>
                  {selectedLevel
                    ? `Log ${LEVEL_LABELS[selectedLevel]} Level`
                    : 'Select a Level'}
                </Text>
              </TouchableOpacity>

              {/* Bottom Spacing */}
              <View style={{ height: 20 }} />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.border.light,
    ...theme.shadows.sm,
  },
  cardLogged: {
    backgroundColor: theme.colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  icon: {
    fontSize: 24,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  category: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  completeBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
  },
  pinButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
  description: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  levelDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  levelBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  levelText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.xs,
  },
  actionHintText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginRight: 4,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background.primary,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '90%',
    paddingTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  modalIcon: {
    fontSize: 32,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: theme.spacing.sm,
  },
  modalSection: {
    marginBottom: theme.spacing.lg,
  },
  modalDescription: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  sourceText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  levelOption: {
    borderWidth: 2,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  levelOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  levelDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  levelOptionTitle: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
  },
  levelOptionDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginLeft: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  benefitIcon: {
    marginTop: 2,
  },
  benefitText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary[600],
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  confirmButtonDisabled: {
    backgroundColor: theme.colors.gray[300],
  },
  confirmButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.background.primary,
  },
});

export default SunnahCard;
