/**
 * Prayer Status Hadith Component
 * Displays relevant authentic hadith based on prayer status
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../../constants/theme';
import type { PrayerStatus } from '../../types';
import type { Hadith } from '../../constants/hadith';

interface PrayerStatusHadithProps {
  hadith: Hadith;
  status: PrayerStatus;
}

export const PrayerStatusHadith: React.FC<PrayerStatusHadithProps> = ({ hadith, status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'on_time':
        return {
          bg: theme.colors.onTime + '15',
          border: theme.colors.onTime,
          text: theme.colors.onTime,
        };
      case 'delayed':
        return {
          bg: theme.colors.delayed + '15',
          border: theme.colors.delayed,
          text: theme.colors.delayed,
        };
      case 'missed':
        return {
          bg: theme.colors.missed + '15',
          border: theme.colors.missed,
          text: theme.colors.missed,
        };
      case 'qadaa':
        return {
          bg: theme.colors.qadaa + '15',
          border: theme.colors.qadaa,
          text: theme.colors.qadaa,
        };
      default:
        return {
          bg: theme.colors.gray[100],
          border: theme.colors.gray[400],
          text: theme.colors.gray[700],
        };
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'on_time':
        return 'Virtue of Praying on Time';
      case 'delayed':
        return "Reminder: Don't Delay Prayer";
      case 'missed':
        return 'The Severity of Missing Prayer';
      case 'qadaa':
        return 'Encouragement: Making Up Missed Prayers';
      default:
        return 'Hadith';
    }
  };

  const colors = getStatusColor();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{getStatusTitle()}</Text>
      </View>

      {/* Hadith Text */}
      <ScrollView
        style={styles.contentContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {hadith.textArabic && (
          <View style={styles.arabicContainer}>
            <Text style={styles.arabicText}>{hadith.textArabic}</Text>
          </View>
        )}

        <Text style={styles.englishText}>{hadith.textEnglish}</Text>

        {/* Reward/Context */}
        {hadith.reward && (
          <View style={[styles.rewardBadge, { backgroundColor: colors.text + '15' }]}>
            <Text style={styles.rewardIcon}>✨</Text>
            <Text style={[styles.rewardText, { color: colors.text }]}>{hadith.reward}</Text>
          </View>
        )}

        {hadith.context && (
          <View style={styles.contextContainer}>
            <Text style={styles.contextIcon}>💡</Text>
            <Text style={styles.contextText}>{hadith.context}</Text>
          </View>
        )}
      </ScrollView>

      {/* Source Reference */}
      <View style={styles.footer}>
        <Text style={styles.sourceIcon}>📚</Text>
        <Text style={styles.sourceText}>
          {hadith.source} {hadith.reference && `(${hadith.reference})`}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.md,
    maxHeight: 500,
  },
  header: {
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
  },
  contentContainer: {
    flexGrow: 1,
    flexShrink: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xs,
  },
  arabicContainer: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.gray[50],
    borderRadius: theme.borderRadius.md,
  },
  arabicText: {
    fontSize: theme.typography.fontSize.lg,
    lineHeight: 32,
    textAlign: 'right',
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  englishText: {
    fontSize: theme.typography.fontSize.md,
    lineHeight: 24,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  rewardIcon: {
    fontSize: 16,
  },
  rewardText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    flex: 1,
  },
  contextContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  contextIcon: {
    fontSize: 16,
  },
  contextText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    gap: theme.spacing.xs,
  },
  sourceIcon: {
    fontSize: 14,
  },
  sourceText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary[600],
    flex: 1,
  },
});

export default PrayerStatusHadith;
