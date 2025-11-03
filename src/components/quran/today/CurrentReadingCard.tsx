/**
 * CurrentReadingCard Component
 * Displays last reading position and allows user to resume
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { theme } from '../../../constants/theme';
import { quranDb } from '../../../services/quranDb';
import { SURAHS } from '../../../constants/quran';

import { createLogger } from '../../../utils/logger';

const logger = createLogger('CurrentReadingCard');

interface CurrentReadingCardProps {
  onResume?: (surahNumber: number, ayahNumber: number) => void;
}

interface ReadingPosition {
  surahNumber: number;
  ayahNumber: number;
  timestamp: number;
}

export const CurrentReadingCard: React.FC<CurrentReadingCardProps> = ({ onResume }) => {
  const [position, setPosition] = useState<ReadingPosition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isFocused = useIsFocused();

  // Reload when component is focused (tab is active)
  useEffect(() => {
    if (isFocused) {
      logger.debug('📖 CurrentReadingCard: Tab focused, reloading position...');
      loadLastPosition();
    }
  }, [isFocused]);


  const loadLastPosition = async () => {
    try {
      const lastPosition = await quranDb.getReadingProgress();
      logger.debug('📖 CurrentReadingCard: Loaded position from DB:', lastPosition);

      if (lastPosition) {
        setPosition({
          surahNumber: lastPosition.lastSurah,
          ayahNumber: lastPosition.lastAyah,
          timestamp: Date.now(), // Use current time since timestamp not stored in SQLite
        });
        logger.debug(`✓ CurrentReadingCard: Displaying Surah ${lastPosition.lastSurah}, Ayah ${lastPosition.lastAyah}`);
      } else {
        logger.debug('ℹ CurrentReadingCard: No reading progress found');
      }
    } catch (error) {
      logger.error('❌ CurrentReadingCard: Error loading reading position:', error);
      // Show empty state if database error
    } finally {
      setIsLoading(false);
    }
  };

  const handleResume = () => {
    if (position && onResume) {
      onResume(position.surahNumber, position.ayahNumber);
    }
  };

  const getSurahInfo = () => {
    if (!position) return null;
    return SURAHS.find((s) => s.number === position.surahNumber);
  };

  const getTimeAgo = () => {
    if (!position) return '';

    const now = Date.now();
    const diff = now - position.timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes > 0 ? `${minutes} minute${minutes > 1 ? 's' : ''} ago` : 'Just now';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!position) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📖</Text>
          <Text style={styles.emptyTitle}>Start Your Journey</Text>
          <Text style={styles.emptySubtitle}>
            Begin reading from the Library to see your progress here
          </Text>
        </View>
      </View>
    );
  }

  const surahInfo = getSurahInfo();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Continue Reading</Text>
        <Text style={styles.timeAgo}>{getTimeAgo()}</Text>
      </View>

      {/* Position Info */}
      <View style={styles.positionContainer}>
        <View style={styles.surahInfo}>
          <Text style={styles.surahName}>{surahInfo?.name}</Text>
          <Text style={styles.surahNameArabic}>{surahInfo?.nameArabic}</Text>
        </View>

        <View style={styles.verseInfo}>
          <View style={styles.verseChip}>
            <Text style={styles.verseLabel}>Verse</Text>
            <Text style={styles.verseNumber}>{position.ayahNumber}</Text>
          </View>
          <Text style={styles.totalAyahs}>of {surahInfo?.numberOfAyahs}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      {surahInfo && (
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${(position.ayahNumber / surahInfo.numberOfAyahs) * 100}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round((position.ayahNumber / surahInfo.numberOfAyahs) * 100)}% complete
          </Text>
        </View>
      )}

      {/* Resume Button */}
      <TouchableOpacity
        style={styles.resumeButton}
        onPress={handleResume}
        activeOpacity={0.7}
      >
        <Text style={styles.resumeButtonText}>Resume Reading</Text>
        <Text style={styles.resumeButtonIcon}>→</Text>
      </TouchableOpacity>

      {/* Quick Stats */}
      {surahInfo && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Type</Text>
            <Text style={styles.statValue}>{surahInfo.revelationType}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Pages</Text>
            <Text style={styles.statValue}>{surahInfo.numberOfPages}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Juz</Text>
            <Text style={styles.statValue}>{surahInfo.juz.join(', ')}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  timeAgo: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  positionContainer: {
    marginBottom: theme.spacing.lg,
  },
  surahInfo: {
    marginBottom: theme.spacing.md,
  },
  surahName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  surahNameArabic: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.primary[600],
    textAlign: 'right',
  },
  verseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary[50],
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.sm,
  },
  verseLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing.xs,
  },
  verseNumber: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[700],
  },
  totalAyahs: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  progressBarContainer: {
    marginBottom: theme.spacing.lg,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary[600],
    borderRadius: theme.borderRadius.full,
  },
  progressText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'right',
  },
  resumeButton: {
    backgroundColor: theme.colors.primary[600],
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    minHeight: 48,
  },
  resumeButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
    marginRight: theme.spacing.sm,
  },
  resumeButtonIcon: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.inverse,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  statValue: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.border.light,
  },
  emptyState: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  loadingState: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },
});

export default CurrentReadingCard;
