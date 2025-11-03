/**
 * BenchmarksTab Component
 * Explains the 3-tier benchmark system and shows user progress
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { useSunnahHabits } from '../../hooks/useSunnahHabits';

const TIER_INFO = [
  {
    level: 'basic' as const,
    title: 'Basic Level',
    subtitle: 'Foundation of Practice',
    icon: '1️⃣',
    color: theme.colors.info,
    description:
      'The essential starting point for incorporating this Sunnah into your daily life. This level represents the minimum recommended practice.',
    benefits: [
      'Build consistent habits',
      'Establish strong foundations',
      'Develop spiritual discipline',
    ],
    example: 'Praying Fajr on time',
  },
  {
    level: 'companion' as const,
    title: 'Companion Level',
    subtitle: 'Following the Sahabah',
    icon: '2️⃣',
    color: theme.colors.secondary[600],
    description:
      'An enhanced practice that aligns with how the Companions of the Prophet (may Allah be pleased with them) practiced this Sunnah.',
    benefits: [
      'Deepen understanding',
      'Increase spiritual rewards',
      'Follow exemplary models',
    ],
    example: 'Praying Fajr in congregation at the masjid',
  },
  {
    level: 'prophetic' as const,
    title: 'Prophetic Level',
    subtitle: 'The Complete Sunnah',
    icon: '3️⃣',
    color: theme.colors.primary[600],
    description:
      'The complete and comprehensive way the Prophet Muhammad ﷺ practiced this Sunnah, representing the highest level of adherence.',
    benefits: [
      'Achieve spiritual excellence',
      'Maximize rewards',
      'Embody prophetic character',
    ],
    example: 'Praying Fajr in first row, arriving early, praying sunnah prayers',
  },
];

export const BenchmarksTab: React.FC = () => {
  const { habits, refresh } = useSunnahHabits({ autoLoad: false });

  // Load data on mount
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Calculate user's progress across levels
  const getProgressStats = () => {
    const totalHabits = habits.length;
    const basicCount = habits.filter(
      h => h.todayLog && h.todayLog.level === 'basic'
    ).length;
    const companionCount = habits.filter(
      h => h.todayLog && h.todayLog.level === 'companion'
    ).length;
    const propheticCount = habits.filter(
      h => h.todayLog && h.todayLog.level === 'prophetic'
    ).length;

    return {
      totalHabits,
      basicCount,
      companionCount,
      propheticCount,
      totalLogged: basicCount + companionCount + propheticCount,
    };
  };

  const stats = getProgressStats();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Introduction */}
      <View style={styles.introCard}>
        <Text style={styles.introIcon}>🎯</Text>
        <Text style={styles.introTitle}>The 3-Tier Benchmark System</Text>
        <Text style={styles.introText}>
          Each Sunnah habit offers three levels of practice, allowing you to gradually
          increase your commitment and reap greater spiritual rewards.
        </Text>
        <Text style={styles.introQuote}>
          "The most beloved deed to Allah is the most regular and constant even if it were
          little."
        </Text>
        <Text style={styles.introSource}>- Prophet Muhammad ﷺ (Bukhari & Muslim)</Text>
      </View>

      {/* Your Progress */}
      {stats.totalLogged > 0 && (
        <View style={styles.progressCard}>
          <Text style={styles.sectionTitle}>Your Progress Today</Text>
          <View style={styles.progressStats}>
            <View style={styles.progressStat}>
              <View
                style={[styles.progressDot, { backgroundColor: theme.colors.info }]}
              />
              <Text style={styles.progressStatLabel}>Basic</Text>
              <Text style={styles.progressStatValue}>{stats.basicCount}</Text>
            </View>
            <View style={styles.progressStat}>
              <View
                style={[
                  styles.progressDot,
                  { backgroundColor: theme.colors.secondary[600] },
                ]}
              />
              <Text style={styles.progressStatLabel}>Companion</Text>
              <Text style={styles.progressStatValue}>{stats.companionCount}</Text>
            </View>
            <View style={styles.progressStat}>
              <View
                style={[
                  styles.progressDot,
                  { backgroundColor: theme.colors.primary[600] },
                ]}
              />
              <Text style={styles.progressStatLabel}>Prophetic</Text>
              <Text style={styles.progressStatValue}>{stats.propheticCount}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Tier Explanations */}
      <View style={styles.tiersSection}>
        <Text style={styles.sectionTitle}>Understanding the Levels</Text>
        <Text style={styles.sectionSubtitle}>
          Each level builds upon the previous, offering a clear path for spiritual growth
        </Text>

        {TIER_INFO.map((tier, index) => (
          <View key={tier.level} style={styles.tierCard}>
            {/* Tier Header */}
            <View style={styles.tierHeader}>
              <View
                style={[styles.tierIconContainer, { backgroundColor: `${tier.color}15` }]}
              >
                <Text style={styles.tierEmoji}>{tier.icon}</Text>
              </View>
              <View style={styles.tierHeaderText}>
                <Text style={[styles.tierTitle, { color: tier.color }]}>
                  {tier.title}
                </Text>
                <Text style={styles.tierSubtitle}>{tier.subtitle}</Text>
              </View>
            </View>

            {/* Description */}
            <Text style={styles.tierDescription}>{tier.description}</Text>

            {/* Benefits */}
            <View style={styles.benefitsSection}>
              <Text style={styles.benefitsTitle}>Benefits</Text>
              {tier.benefits.map((benefit, idx) => (
                <View key={idx} style={styles.benefitItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={tier.color}
                    style={styles.benefitIcon}
                  />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>

            {/* Example */}
            <View style={[styles.exampleBox, { borderLeftColor: tier.color }]}>
              <Text style={styles.exampleLabel}>Example</Text>
              <Text style={styles.exampleText}>{tier.example}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* How to Progress */}
      <View style={styles.tipsCard}>
        <View style={styles.tipsHeader}>
          <Ionicons name="bulb" size={24} color={theme.colors.warning} />
          <Text style={styles.tipsTitle}>Tips for Progression</Text>
        </View>
        <View style={styles.tipsList}>
          <View style={styles.tipItem}>
            <Text style={styles.tipNumber}>1</Text>
            <Text style={styles.tipText}>
              <Text style={styles.tipBold}>Start Small:</Text> Master the Basic level
              before moving to Companion level
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipNumber}>2</Text>
            <Text style={styles.tipText}>
              <Text style={styles.tipBold}>Be Consistent:</Text> Regular practice at any
              level is better than sporadic higher-level practice
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipNumber}>3</Text>
            <Text style={styles.tipText}>
              <Text style={styles.tipBold}>Track Progress:</Text> Log your daily practice
              to see your spiritual growth over time
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipNumber}>4</Text>
            <Text style={styles.tipText}>
              <Text style={styles.tipBold}>Seek Knowledge:</Text> Learn the wisdom behind
              each Sunnah to increase motivation
            </Text>
          </View>
        </View>
      </View>

      {/* Rewards Reminder */}
      <View style={styles.rewardsCard}>
        <Text style={styles.rewardsIcon}>⭐</Text>
        <Text style={styles.rewardsTitle}>Remember the Rewards</Text>
        <Text style={styles.rewardsText}>
          Every level of practice brings immense reward from Allah. Don't underestimate the
          value of even the Basic level - consistency in small actions is beloved to Allah.
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
  introCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  introIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  introTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  introText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  introQuote: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  introSource: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  progressCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.spacing.md,
  },
  progressStat: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressStatLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  progressStatValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  tiersSection: {
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
  tierCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  tierIconContainer: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierEmoji: {
    fontSize: 28,
  },
  tierHeaderText: {
    flex: 1,
  },
  tierTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: 2,
  },
  tierSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  tierDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  benefitsSection: {
    marginBottom: theme.spacing.md,
  },
  benefitsTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
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
  exampleBox: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderLeftWidth: 4,
  },
  exampleLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.xs,
  },
  exampleText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  tipsCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  tipsTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  tipsList: {
    gap: theme.spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  tipNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary[600],
    color: theme.colors.background.primary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
    lineHeight: 24,
  },
  tipText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  tipBold: {
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  rewardsCard: {
    backgroundColor: `${theme.colors.success}15`,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  rewardsIcon: {
    fontSize: 40,
    marginBottom: theme.spacing.sm,
  },
  rewardsTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.success,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  rewardsText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: theme.spacing.xl,
  },
});

export default BenchmarksTab;
