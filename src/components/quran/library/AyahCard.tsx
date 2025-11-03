/**
 * AyahCard Component
 * Displays individual verse with Arabic text and translation
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../../constants/theme';
import { Ayah } from '../../../types';
import AyahWebView from './AyahWebView';

interface AyahCardProps {
  ayah: Ayah;
  isPlaying?: boolean;
  shouldUseWebView?: boolean; // Keep WebView mounted even after playback ends
  isHighlighted?: boolean;
  isBookmarked?: boolean;
  currentWordIndex?: number; // Index of currently playing word (-1 if none)
  onPress?: () => void;
  onLongPress?: () => void;
  onBookmarkToggle?: () => void;
  showTranslation?: boolean;
}

export const AyahCard: React.FC<AyahCardProps> = ({
  ayah,
  isPlaying = false,
  shouldUseWebView = false,
  isHighlighted = false,
  isBookmarked = false,
  currentWordIndex = -1,
  onPress,
  onLongPress,
  onBookmarkToggle,
  showTranslation = true,
}) => {
  return (
    <View style={styles.animatedContainer}>
      <TouchableOpacity
        style={[
          styles.container,
          isPlaying && styles.containerPlaying, // Apply playing style LAST so it overrides
          isHighlighted && !isPlaying && styles.containerHighlighted, // Only apply highlighted if not playing
        ]}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.7}
        disabled={!onPress && !onLongPress}
      >
        {/* Ayah Number Badge */}
        <View style={styles.numberContainer}>
          <View
            style={[
              styles.numberBadge,
              isPlaying && styles.numberBadgePlaying,
            ]}
          >
            <Text
              style={[
                styles.numberText,
                isPlaying && styles.numberTextPlaying,
              ]}
            >
              {ayah.number}
            </Text>
          </View>
          {isPlaying && (
            <View style={styles.playingBadge}>
              <Text style={styles.playingBadgeText}>▶ Playing</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {/* Arabic Text - Use WebView for word highlighting when playing or recently played */}
          {shouldUseWebView ? (
            <View style={styles.webViewContainer}>
              <AyahWebView
                ayah={ayah}
                currentWordIndex={currentWordIndex}
                isPlaying={isPlaying}
                showTranslation={false}
              />
            </View>
          ) : (
            <View style={styles.arabicContainer}>
              <Text style={styles.arabicText}>
                {ayah.text} <Text style={styles.ayahEndMarker}>۝{ayah.number}</Text>
              </Text>
            </View>
          )}

          {/* Translation */}
          {showTranslation && ayah.translation && (
            <View style={styles.translationContainer}>
              <Text style={styles.translationText}>{ayah.translation}</Text>
            </View>
          )}

          {/* Metadata */}
          <View style={styles.metadataContainer}>
            {ayah.page && (
              <Text style={styles.metadataText}>Page {ayah.page}</Text>
            )}
            {ayah.juz && ayah.page && <Text style={styles.metadataDot}>•</Text>}
            {ayah.juz && (
              <Text style={styles.metadataText}>Juz {ayah.juz}</Text>
            )}
          </View>
        </View>

        {/* Bookmark Button */}
        {onBookmarkToggle && (
          <TouchableOpacity
            style={styles.bookmarkButton}
            onPress={(e) => {
              e.stopPropagation();
              onBookmarkToggle();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.bookmarkIcon, isBookmarked && styles.bookmarkIconActive]}>
              {isBookmarked ? '🔖' : '📑'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Playing Indicator */}
        {isPlaying && (
          <View style={styles.playingIndicator}>
            <View style={styles.playingDot} />
            <View style={styles.playingDot} />
            <View style={styles.playingDot} />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

// Memoize component with custom comparison to prevent unnecessary re-renders
const MemoizedAyahCard = React.memo(AyahCard, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.ayah.number === nextProps.ayah.number &&
    prevProps.isPlaying === nextProps.isPlaying &&
    prevProps.shouldUseWebView === nextProps.shouldUseWebView &&
    prevProps.isHighlighted === nextProps.isHighlighted &&
    prevProps.isBookmarked === nextProps.isBookmarked &&
    prevProps.currentWordIndex === nextProps.currentWordIndex &&
    prevProps.showTranslation === nextProps.showTranslation
  );
});

const styles = StyleSheet.create({
  animatedContainer: {
    marginBottom: theme.spacing.md,
    position: 'relative',
  },
  container: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
    position: 'relative',
    zIndex: 2,
  },
  containerHighlighted: {
    backgroundColor: theme.colors.primary[50],
    borderWidth: 2,
    borderColor: theme.colors.primary[300],
  },
  containerPlaying: {
    backgroundColor: '#E8F5E9', // Light green background - easy on the eyes
    borderWidth: 2,
    borderColor: '#4CAF50', // Medium green border
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  numberContainer: {
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playingBadge: {
    backgroundColor: '#4CAF50', // Medium green badge
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  playingBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  numberBadge: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberBadgePlaying: {
    backgroundColor: '#4CAF50', // Medium green when playing
  },
  numberText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[700],
  },
  numberTextPlaying: {
    color: '#FFFFFF', // White text on yellow background
  },
  contentContainer: {
    flex: 1,
  },
  webViewContainer: {
    height: 'auto',
    marginBottom: theme.spacing.md,
  },
  arabicContainer: {
    marginBottom: theme.spacing.md,
  },
  arabicText: {
    fontSize: theme.typography.fontSize.xl,
    lineHeight: theme.typography.fontSize.xl * 2,
    color: theme.colors.text.primary,
    textAlign: 'right',
    fontWeight: theme.typography.fontWeight.medium,
  },
  arabicWord: {
    // Base style for individual words
  },
  arabicWordHighlighted: {
    backgroundColor: '#FFEB3B', // Bright yellow background for highlighted word
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  ayahEndMarker: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.primary[600],
  },
  translationContainer: {
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    marginBottom: theme.spacing.sm,
  },
  translationText: {
    fontSize: theme.typography.fontSize.md,
    lineHeight: theme.typography.fontSize.md * 1.6,
    color: theme.colors.text.secondary,
  },
  metadataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  metadataText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  metadataDot: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginHorizontal: theme.spacing.sm,
  },
  bookmarkButton: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  bookmarkIcon: {
    fontSize: 20,
  },
  bookmarkIconActive: {
    transform: [{ scale: 1.1 }],
  },
  playingIndicator: {
    position: 'absolute',
    bottom: theme.spacing.md,
    right: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  playingDot: {
    width: 6,
    height: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.secondary[600],
  },
});

export default MemoizedAyahCard;
