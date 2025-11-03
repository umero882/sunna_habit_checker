/**
 * Hadith Card Component
 * Displays daily hadith with source and sharing options
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../common/Card';
import { theme } from '../../constants/theme';
import type { Hadith } from '../../constants/hadith';

export interface HadithCardProps {
  hadith: Hadith;
  onLearnMore?: () => void;
}

export const HadithCard: React.FC<HadithCardProps> = ({ hadith, onLearnMore }) => {
  const [showArabic, setShowArabic] = useState(false);

  return (
    <Card style={styles.card} padding="large" elevation="medium">
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="book-outline" size={20} color={theme.colors.primary[600]} />
          <Text style={styles.title}>Hadith of the Day</Text>
        </View>

        {hadith.textArabic && (
          <TouchableOpacity onPress={() => setShowArabic(!showArabic)} style={styles.toggleButton}>
            <Text style={styles.toggleText}>{showArabic ? 'EN' : 'AR'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Hadith Text */}
      <View style={styles.textContainer}>
        {showArabic && hadith.textArabic ? (
          <Text style={styles.textArabic}>{hadith.textArabic}</Text>
        ) : (
          <Text style={styles.text}>{hadith.textEnglish}</Text>
        )}
      </View>

      {/* Source */}
      <View style={styles.sourceContainer}>
        <Text style={styles.source}>
          — {hadith.source} {hadith.reference}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {onLearnMore && (
          <TouchableOpacity onPress={onLearnMore} style={styles.learnMoreButton}>
            <Text style={styles.learnMoreText}>Learn More</Text>
            <Ionicons name="arrow-forward" size={14} color={theme.colors.primary[600]} />
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: theme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  toggleButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.primary[100],
    borderRadius: theme.borderRadius.sm,
  },
  toggleText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary[700],
  },
  textContainer: {
    marginBottom: theme.spacing.md,
  },
  text: {
    fontSize: theme.typography.fontSize.md,
    lineHeight: 24,
    color: theme.colors.text.primary,
  },
  textArabic: {
    fontSize: theme.typography.fontSize.lg,
    lineHeight: 32,
    color: theme.colors.text.primary,
    textAlign: 'right',
  },
  sourceContainer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    paddingTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  source: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  learnMoreText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary[600],
  },
});

export default HadithCard;
