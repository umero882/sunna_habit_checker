/**
 * Reflection Strip Component
 * Khushu slider and journal prompts for spiritual reflection
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { theme } from '../../constants/theme';

export interface ReflectionStripProps {
  onKhushuChange?: (value: number) => void;
  onJournalPress?: () => void;
  initialKhushu?: number;
}

const KHUSHU_LABELS = ['Low', 'Fair', 'Good', 'Great', 'Excellent'];

const JOURNAL_PROMPTS = [
  'How was your khushu today?',
  'What made you grateful today?',
  'Any challenges in your worship?',
  'What brought you closer to Allah?',
  'How can you improve tomorrow?',
];

/**
 * Get random journal prompt
 */
function getRandomPrompt(): string {
  return JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)];
}

/**
 * Get khushu label based on value
 */
function getKhushuLabel(value: number): string {
  const index = Math.floor(value / 20);
  return KHUSHU_LABELS[Math.min(index, KHUSHU_LABELS.length - 1)];
}

/**
 * Get khushu color based on value
 */
function getKhushuColor(value: number): string {
  if (value < 20) return theme.colors.error;
  if (value < 40) return theme.colors.warning;
  if (value < 60) return theme.colors.secondary[500];
  if (value < 80) return theme.colors.info;
  return theme.colors.success;
}

export const ReflectionStrip: React.FC<ReflectionStripProps> = ({
  onKhushuChange,
  onJournalPress,
  initialKhushu = 50,
}) => {
  const [khushuValue, setKhushuValue] = useState(initialKhushu);
  const [journalPrompt] = useState(() => getRandomPrompt());

  // Update local state when initialKhushu changes (e.g., after loading from DB)
  React.useEffect(() => {
    setKhushuValue(initialKhushu);
  }, [initialKhushu]);

  const handleKhushuChange = (value: number) => {
    setKhushuValue(value);
    onKhushuChange?.(value);
  };

  const khushuLabel = getKhushuLabel(khushuValue);
  const khushuColor = getKhushuColor(khushuValue);

  return (
    <View style={styles.container}>
      {/* Khushu Section */}
      <View style={styles.khushuSection}>
        <View style={styles.khushuHeader}>
          <View style={styles.khushuTitleRow}>
            <Ionicons name="heart-outline" size={18} color={theme.colors.primary[600]} />
            <Text style={styles.khushuTitle}>Khushu Level</Text>
          </View>
          <View style={[styles.khushuBadge, { backgroundColor: `${khushuColor}20` }]}>
            <Text style={[styles.khushuBadgeText, { color: khushuColor }]}>{khushuLabel}</Text>
          </View>
        </View>

        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            step={10}
            value={khushuValue}
            onValueChange={handleKhushuChange}
            minimumTrackTintColor={khushuColor}
            maximumTrackTintColor={theme.colors.gray[300]}
            thumbTintColor={khushuColor}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>Low</Text>
            <Text style={styles.sliderLabel}>High</Text>
          </View>
        </View>
      </View>

      {/* Journal Prompt */}
      <TouchableOpacity
        style={styles.journalPrompt}
        onPress={onJournalPress}
        activeOpacity={0.7}
      >
        <View style={styles.journalIcon}>
          <Ionicons name="book-outline" size={20} color={theme.colors.secondary[600]} />
        </View>
        <View style={styles.journalContent}>
          <Text style={styles.journalTitle}>Reflection</Text>
          <Text style={styles.journalText} numberOfLines={1}>
            {journalPrompt}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    gap: theme.spacing.md,
  },
  khushuSection: {
    gap: theme.spacing.sm,
  },
  khushuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  khushuTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  khushuTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  khushuBadge: {
    paddingVertical: theme.spacing.xs / 2,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  khushuBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  sliderContainer: {
    paddingHorizontal: theme.spacing.xs,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  sliderLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  journalPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  journalIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    backgroundColor: `${theme.colors.secondary[600]}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  journalContent: {
    flex: 1,
  },
  journalTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  journalText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
});

export default ReflectionStrip;
