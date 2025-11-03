/**
 * SurahList Component
 * Displays scrollable list of all 114 Surahs with search
 */

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { theme } from '../../../constants/theme';
import { SURAHS } from '../../../constants/quran';
import { SurahMeta } from '../../../types';
import SurahCard from './SurahCard';

type FilterType = 'all' | 'meccan' | 'medinan';
type SortType = 'number' | 'name' | 'verses';

interface SurahListProps {
  onSurahPress: (surah: SurahMeta) => void;
}

export const SurahList: React.FC<SurahListProps> = ({ onSurahPress }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('number');

  // Filter and sort surahs
  const filteredSurahs = useMemo(() => {
    let surahs = [...SURAHS];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      surahs = surahs.filter(
        (surah) =>
          surah.name.toLowerCase().includes(query) ||
          surah.nameArabic.includes(query) ||
          surah.nameTransliteration.toLowerCase().includes(query) ||
          surah.number.toString().includes(query) ||
          surah.revelationType.toLowerCase().includes(query)
      );
    }

    // Apply revelation type filter
    if (filter !== 'all') {
      const filterType = filter === 'meccan' ? 'Meccan' : 'Medinan';
      surahs = surahs.filter((surah) => surah.revelationType === filterType);
    }

    // Apply sorting
    surahs.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'verses':
          return b.numberOfAyahs - a.numberOfAyahs;
        case 'number':
        default:
          return a.number - b.number;
      }
    });

    return surahs;
  }, [searchQuery, filter, sortBy]);

  const renderSurahItem = ({ item }: { item: SurahMeta }) => (
    <SurahCard surah={item} onPress={() => onSurahPress(item)} />
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Qur'an Library</Text>
        <Text style={styles.subtitle}>
          {filteredSurahs.length} {filter !== 'all' ? `${filter.charAt(0).toUpperCase() + filter.slice(1)} ` : ''}Surah{filteredSurahs.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, number, or type..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.colors.text.tertiary}
        />
        {searchQuery.length > 0 && (
          <Text
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            ✕
          </Text>
        )}
      </View>

      {/* Filter Chips */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filterLabel}>Filter:</Text>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'meccan' && styles.filterChipActive]}
          onPress={() => setFilter('meccan')}
        >
          <Text style={[styles.filterChipText, filter === 'meccan' && styles.filterChipTextActive]}>
            Meccan (86)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'medinan' && styles.filterChipActive]}
          onPress={() => setFilter('medinan')}
        >
          <Text style={[styles.filterChipText, filter === 'medinan' && styles.filterChipTextActive]}>
            Medinan (28)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <TouchableOpacity
          style={[styles.sortChip, sortBy === 'number' && styles.sortChipActive]}
          onPress={() => setSortBy('number')}
        >
          <Text style={[styles.sortChipText, sortBy === 'number' && styles.sortChipTextActive]}>
            Number
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortChip, sortBy === 'name' && styles.sortChipActive]}
          onPress={() => setSortBy('name')}
        >
          <Text style={[styles.sortChipText, sortBy === 'name' && styles.sortChipTextActive]}>
            Name
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortChip, sortBy === 'verses' && styles.sortChipActive]}
          onPress={() => setSortBy('verses')}
        >
          <Text style={[styles.sortChipText, sortBy === 'verses' && styles.sortChipTextActive]}>
            Verses
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📖</Text>
      <Text style={styles.emptyTitle}>No Surahs Found</Text>
      <Text style={styles.emptySubtitle}>
        Try searching with a different term
      </Text>
    </View>
  );

  const renderSeparator = () => <View style={styles.separator} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredSurahs}
        renderItem={renderSurahItem}
        keyExtractor={(item) => item.number.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ItemSeparatorComponent={renderSeparator}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={10}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  listContent: {
    paddingBottom: theme.spacing.xl,
  },
  headerContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.background.primary,
  },
  titleContainer: {
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  searchIcon: {
    fontSize: theme.typography.fontSize.lg,
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    padding: 0,
  },
  clearButton: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
    padding: theme.spacing.sm,
  },
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  filterLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing.xs,
  },
  filterChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary[600],
    borderColor: theme.colors.primary[600],
  },
  filterChipText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  filterChipTextActive: {
    color: theme.colors.text.inverse,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  sortLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing.xs,
  },
  sortChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  sortChipActive: {
    backgroundColor: theme.colors.secondary[100],
    borderColor: theme.colors.secondary[600],
  },
  sortChipText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  sortChipTextActive: {
    color: theme.colors.secondary[700],
    fontWeight: theme.typography.fontWeight.semibold,
  },
  resultsContainer: {
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  resultsText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  separator: {
    height: theme.spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl * 2,
    paddingHorizontal: theme.spacing.xl,
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
  emptySubtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});

export default SurahList;
