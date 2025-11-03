/**
 * Daily Progress Bar Component
 * Beautiful independent cards for each pillar showing actual progress
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import type { DailyStats } from '../../utils/habitAggregation';

export interface DailyProgressBarProps {
  stats: DailyStats;
  onPressCategory?: (category: 'prayer' | 'quran' | 'sunnah' | 'charity') => void;
}

interface PillarCardProps {
  emoji: string;
  label: string;
  current: number;
  total: number;
  percentage: number;
  color: string;
  subtitle?: string;
  unit?: string; // 'tasks' or 'pages'
  onPress?: () => void;
}

const PillarCard: React.FC<PillarCardProps> = ({
  emoji,
  label,
  current,
  total,
  percentage,
  color,
  subtitle,
  unit = 'tasks',
  onPress,
}) => {
  const isComplete = percentage === 100;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { borderLeftWidth: 4, borderLeftColor: color },
        isComplete && styles.cardComplete,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.cardContent}>
        <View style={[styles.iconCircle, { backgroundColor: `${color}15` }]}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>

        <View style={styles.cardInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.cardTitle}>{label}</Text>
            {isComplete && (
              <View style={[styles.completeBadge, { backgroundColor: color }]}>
                <Ionicons name="checkmark" size={14} color="white" />
              </View>
            )}
          </View>
          {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}

          <View style={styles.metricsRow}>
            <View style={styles.metricMain}>
              <Text style={styles.fractionText}>
                <Text style={[styles.currentNumber, { color }]}>{current}</Text>
                <Text style={styles.totalNumber}>/{total}</Text>
              </Text>
              <Text style={styles.metricLabel}>{unit}</Text>
            </View>

            <View style={[styles.percentageBadge, { backgroundColor: `${color}15` }]}>
              <Text style={[styles.percentageText, { color }]}>{percentage}%</Text>
            </View>
          </View>

          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${percentage}%`, backgroundColor: color },
              ]}
            />
          </View>
        </View>
      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color={theme.colors.gray[400]}
        style={styles.chevron}
      />
    </TouchableOpacity>
  );
};

export const DailyProgressBar: React.FC<DailyProgressBarProps> = ({
  stats,
  onPressCategory,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Today's Progress</Text>

      <View style={styles.cardsGrid}>
        <PillarCard
          emoji="🕋"
          label="Prayer"
          current={stats.prayer.completed}
          total={stats.prayer.total}
          percentage={stats.prayer.completionPercentage}
          color={theme.colors.primary[600]}
          subtitle="5 daily prayers"
          onPress={() => onPressCategory?.('prayer')}
        />

        <PillarCard
          emoji="📖"
          label="Qur'an"
          current={stats.quran.pagesRead}
          total={stats.quran.targetPages || 2}
          percentage={stats.quran.completionPercentage}
          color={theme.colors.info}
          subtitle="Reading & memorization"
          unit="pages"
          onPress={() => onPressCategory?.('quran')}
        />

        <PillarCard
          emoji="☀️"
          label="Sunnah"
          current={stats.sunnah.habitsCompleted}
          total={stats.sunnah.totalHabits}
          percentage={stats.sunnah.completionPercentage}
          color={theme.colors.secondary[600]}
          subtitle="Daily sunnah practices"
          onPress={() => onPressCategory?.('sunnah')}
        />

        <PillarCard
          emoji="💰"
          label="Charity"
          current={stats.charity.hasEntry ? 1 : 0}
          total={1}
          percentage={stats.charity.hasEntry ? 100 : 0}
          color={theme.colors.success}
          subtitle="Daily sadaqah"
          onPress={() => onPressCategory?.('charity')}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    ...theme.shadows.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  cardsGrid: {
    gap: theme.spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
    gap: theme.spacing.sm,
  },
  cardComplete: {
    backgroundColor: `${theme.colors.success}08`,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 28,
  },
  cardInfo: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  completeBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardSubtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.xs / 2,
  },
  metricMain: {
    gap: 2,
  },
  fractionText: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currentNumber: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    lineHeight: theme.typography.fontSize.xl * 1.2,
  },
  totalNumber: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.fontSize.lg * 1.2,
  },
  metricLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  percentageBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  percentageText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
    marginTop: theme.spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: theme.borderRadius.full,
  },
  chevron: {
    marginLeft: theme.spacing.xs,
  },
});

export default DailyProgressBar;
