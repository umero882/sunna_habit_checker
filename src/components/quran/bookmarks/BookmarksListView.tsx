/**
 * BookmarksListView Component
 * Displays list of all user bookmarks
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../../../constants/theme';
import { useBookmarks, Bookmark } from '../../../hooks/useBookmarks';
import { SURAHS } from '../../../constants/quran';

import { createLogger } from '../../../utils/logger';

const logger = createLogger('BookmarksListView');

interface BookmarksListViewProps {
  userId?: string;
  onBookmarkPress?: (surahNumber: number, ayahNumber: number) => void;
}

export const BookmarksListView: React.FC<BookmarksListViewProps> = ({
  userId,
  onBookmarkPress,
}) => {
  const { bookmarks, isLoading, removeBookmark } = useBookmarks(userId);

  const getSurahName = (surahNumber: number): string => {
    const surah = SURAHS.find(s => s.number === surahNumber);
    return surah?.name || `Surah ${surahNumber}`;
  };

  const getSurahNameArabic = (surahNumber: number): string => {
    const surah = SURAHS.find(s => s.number === surahNumber);
    return surah?.nameArabic || '';
  };

  const handleRemoveBookmark = async (bookmark: Bookmark) => {
    try {
      await removeBookmark(bookmark.surah_number, bookmark.ayah_number);
    } catch (error) {
      logger.error('Failed to remove bookmark:', error);
    }
  };

  const renderBookmark = ({ item }: { item: Bookmark }) => (
    <View style={styles.bookmarkCard}>
      <TouchableOpacity
        style={styles.bookmarkContent}
        onPress={() => onBookmarkPress?.(item.surah_number, item.ayah_number)}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.bookmarkHeader}>
          <View style={styles.surahInfo}>
            <Text style={styles.surahName}>{getSurahName(item.surah_number)}</Text>
            <Text style={styles.surahNameArabic}>{getSurahNameArabic(item.surah_number)}</Text>
          </View>
          <View style={styles.ayahBadge}>
            <Text style={styles.ayahBadgeText}>Ayah {item.ayah_number}</Text>
          </View>
        </View>

        {/* Note (if exists) */}
        {item.note && (
          <View style={styles.noteContainer}>
            <Text style={styles.noteLabel}>Note:</Text>
            <Text style={styles.noteText}>{item.note}</Text>
          </View>
        )}

        {/* Date */}
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>
            {new Date(item.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Remove Button */}
      <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveBookmark(item)}>
        <Text style={styles.removeIcon}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔖</Text>
      <Text style={styles.emptyTitle}>No Bookmarks Yet</Text>
      <Text style={styles.emptyText}>
        Tap the bookmark icon on any verse to save it here for quick access
      </Text>
    </View>
  );

  if (!userId) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🔒</Text>
        <Text style={styles.emptyTitle}>Sign in Required</Text>
        <Text style={styles.emptyText}>Please sign in to save and view your bookmarks</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[600]} />
        <Text style={styles.loadingText}>Loading bookmarks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookmarks</Text>
        <Text style={styles.headerSubtitle}>
          {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={bookmarks}
        renderItem={renderBookmark}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  header: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl * 2,
  },
  bookmarkCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadows.sm,
    flexDirection: 'row',
  },
  bookmarkContent: {
    flex: 1,
    padding: theme.spacing.md,
  },
  bookmarkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  surahInfo: {
    flex: 1,
  },
  surahName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  surahNameArabic: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.primary[600],
  },
  ayahBadge: {
    backgroundColor: theme.colors.primary[100],
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  ayahBadgeText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary[700],
  },
  noteContainer: {
    backgroundColor: theme.colors.secondary[50],
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  noteLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  noteText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.fontSize.sm * 1.5,
  },
  dateContainer: {
    marginTop: theme.spacing.xs,
  },
  dateText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  removeButton: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.feedback.errorLight,
  },
  removeIcon: {
    fontSize: 24,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
});

export default BookmarksListView;
