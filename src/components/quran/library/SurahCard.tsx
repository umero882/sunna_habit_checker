/**
 * SurahCard Component
 * Individual card for each Surah in the list
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../../constants/theme';
import { SurahMeta } from '../../../types';
import { useQuranAudio } from '../../../hooks/useQuranAudio';

interface SurahCardProps {
  surah: SurahMeta;
  onPress: () => void;
}

export const SurahCard: React.FC<SurahCardProps> = ({ surah, onPress }) => {
  const [isCached, setIsCached] = useState(false);
  const { isSurahCached } = useQuranAudio({ reciter: 'ar.alafasy' });

  // Check if surah audio is cached
  useEffect(() => {
    const checkCache = async () => {
      const cached = await isSurahCached(surah.number);
      setIsCached(cached);
    };
    checkCache();
  }, [surah.number, isSurahCached]);
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {/* Number Badge */}
      <View style={styles.numberBadge}>
        <Text style={styles.numberText}>{surah.number}</Text>
      </View>

      {/* Surah Info */}
      <View style={styles.infoContainer}>
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{surah.name}</Text>
          <Text style={styles.transliteration}>{surah.nameTransliteration}</Text>
        </View>

        <View style={styles.metaContainer}>
          <View style={styles.metaChip}>
            <Text style={styles.metaText}>{surah.revelationType}</Text>
          </View>
          <View style={styles.metaDot} />
          <Text style={styles.metaText}>{surah.numberOfAyahs} Verses</Text>
        </View>
      </View>

      {/* Arabic Name */}
      <View style={styles.arabicContainer}>
        <Text style={styles.arabicName}>{surah.nameArabic}</Text>
        {isCached && (
          <View style={styles.downloadBadge}>
            <Text style={styles.downloadIcon}>✓</Text>
          </View>
        )}
      </View>

      {/* Arrow Icon */}
      <View style={styles.arrowContainer}>
        <Text style={styles.arrowIcon}>→</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
    marginHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.sm,
    minHeight: 80,
  },
  numberBadge: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary[50],
    borderWidth: 2,
    borderColor: theme.colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  numberText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[700],
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  nameContainer: {
    marginBottom: theme.spacing.xs,
  },
  name: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  transliteration: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaChip: {
    backgroundColor: theme.colors.secondary[100],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  metaText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.text.tertiary,
    marginHorizontal: theme.spacing.sm,
  },
  arabicContainer: {
    marginLeft: theme.spacing.md,
    alignItems: 'center',
  },
  arabicName: {
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeight.semibold,
  },
  downloadBadge: {
    marginTop: theme.spacing.xs,
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  downloadIcon: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.inverse,
    fontWeight: theme.typography.fontWeight.bold,
  },
  arrowContainer: {
    marginLeft: theme.spacing.md,
    padding: theme.spacing.sm,
  },
  arrowIcon: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.tertiary,
  },
});

export default SurahCard;
