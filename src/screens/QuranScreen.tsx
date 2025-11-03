/**
 * Qur'an Screen
 * Main screen with tabs: Today, Library, Planner
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { theme } from '../constants/theme';
import { supabase } from '../services/supabase';
import { SurahMeta } from '../types';

// Today Tab Components
import {
  DailyGoalCard,
  CurrentReadingCard,
  QuickLogButton,
  StatisticsCard,
} from '../components/quran/today';

// Hooks
import { useQuranStatistics } from '../hooks/useQuranStatistics';

// Library Tab Components
import { SurahList, QuranReader } from '../components/quran/library';

// Planner Tab Components
import { PlannerTab } from '../components/quran/planner';

// Bookmarks Components
import { BookmarksListView } from '../components/quran/bookmarks';

// Initialize services
import { quranDb } from '../services/quranDb';

// Common Components
import { SignInPrompt } from '../components/common';

import { createLogger } from '../utils/logger';

const logger = createLogger('QuranScreen');

const { width } = Dimensions.get('window');

type TabName = 'today' | 'library' | 'planner';

export const QuranScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabName>('today');
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedSurah, setSelectedSurah] = useState<SurahMeta | null>(null);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [initialAyah, setInitialAyah] = useState(1);

  // Get user
  useEffect(() => {
    const initialize = async () => {
      try {
        // Get current user
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error) {
          logger.error('Failed to get user:', error);
        } else if (user) {
          setUserId(user.id);
        }
      } catch (error) {
        logger.error("Failed to initialize Qur'an module:", error);
      }
    };

    initialize();
  }, []);

  // Handle resume reading from CurrentReadingCard
  const handleResumeReading = (surahNumber: number, ayahNumber: number) => {
    // Find the surah
    const surah = require('../constants/quran').SURAHS.find(
      (s: SurahMeta) => s.number === surahNumber
    );

    if (surah) {
      setSelectedSurah(surah);
      setInitialAyah(ayahNumber);
      setIsReaderOpen(true);
      setActiveTab('library');
    }
  };

  // Handle surah selection from library
  const handleSurahPress = (surah: SurahMeta) => {
    setSelectedSurah(surah);
    setInitialAyah(1);
    setIsReaderOpen(true);
  };

  // Handle back from reader
  const handleBackFromReader = () => {
    setIsReaderOpen(false);
    setSelectedSurah(null);
  };

  // Handle log complete - refresh today tab
  const handleLogComplete = () => {
    // Force re-render of today tab components
    setActiveTab('today');
  };

  // Today Tab Content Component - Uses statistics hook
  const TodayTabContent: React.FC<{
    userId: string;
    onResumeReading: (surahNumber: number, ayahNumber: number) => void;
    onLogComplete: () => void;
    onBookmarkPress: (surahNumber: number, ayahNumber: number) => void;
  }> = ({ userId, onResumeReading, onLogComplete, onBookmarkPress }) => {
    const { statistics, isLoading, error } = useQuranStatistics(userId);

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.todayContainer}>
          {/* Daily Goal Card */}
          <DailyGoalCard userId={userId} />

          {/* Statistics Card */}
          <View style={styles.cardSpacing}>
            {isLoading ? (
              <View style={styles.loadingCard}>
                <Text style={styles.loadingText}>Loading statistics...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>Failed to load statistics</Text>
              </View>
            ) : statistics ? (
              <StatisticsCard userId={userId} stats={statistics} />
            ) : null}
          </View>

          {/* Current Reading Card */}
          <View style={styles.cardSpacing}>
            <CurrentReadingCard onResume={onResumeReading} />
          </View>

          {/* Quick Log Button */}
          <View style={styles.cardSpacing}>
            <QuickLogButton userId={userId} onLogComplete={onLogComplete} />
          </View>

          {/* Bookmarks Section */}
          <View style={styles.cardSpacing}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Bookmarks</Text>
            </View>
            <View style={styles.bookmarksContainer}>
              <BookmarksListView userId={userId} onBookmarkPress={onBookmarkPress} />
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  // Render Tab Bar
  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'today' && styles.tabActive]}
        onPress={() => setActiveTab('today')}
      >
        <Text style={[styles.tabText, activeTab === 'today' && styles.tabTextActive]}>Today</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'library' && styles.tabActive]}
        onPress={() => setActiveTab('library')}
      >
        <Text style={[styles.tabText, activeTab === 'library' && styles.tabTextActive]}>
          Library
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'planner' && styles.tabActive]}
        onPress={() => setActiveTab('planner')}
      >
        <Text style={[styles.tabText, activeTab === 'planner' && styles.tabTextActive]}>
          Planner
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render Today Tab
  const renderTodayTab = () => {
    if (!userId) {
      return (
        <SignInPrompt
          title="Track Your Qur'an Journey"
          message="Sign in to track your reading progress, set goals, and view comprehensive statistics"
          icon="profile"
        />
      );
    }

    return (
      <TodayTabContent
        userId={userId}
        onResumeReading={handleResumeReading}
        onLogComplete={handleLogComplete}
        onBookmarkPress={(surahNumber, ayahNumber) => {
          const surah = require('../constants/quran').SURAHS.find(
            (s: SurahMeta) => s.number === surahNumber
          );
          if (surah) {
            setSelectedSurah(surah);
            setInitialAyah(ayahNumber);
            setIsReaderOpen(true);
            setActiveTab('library');
          }
        }}
      />
    );
  };

  // Render Library Tab
  const renderLibraryTab = () => {
    if (isReaderOpen && selectedSurah) {
      return (
        <View style={styles.readerContainer}>
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={handleBackFromReader}>
            <Text style={styles.backIcon}>←</Text>
            <Text style={styles.backText}>Back to Library</Text>
          </TouchableOpacity>

          {/* Quran Reader */}
          <QuranReader
            surahNumber={selectedSurah.number}
            initialAyah={initialAyah}
            userId={userId || undefined}
            onSurahChange={newSurahNumber => {
              // When continuous play moves to next surah
              const nextSurah = require('../constants/quran').SURAHS.find(
                (s: SurahMeta) => s.number === newSurahNumber
              );
              if (nextSurah) {
                setSelectedSurah(nextSurah);
                setInitialAyah(1);
              }
            }}
          />
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        <SurahList onSurahPress={handleSurahPress} />
      </View>
    );
  };

  // Render Planner Tab
  const renderPlannerTab = () => {
    return <PlannerTab userId={userId || undefined} />;
  };

  return (
    <View style={styles.container}>
      {/* Tab Bar */}
      {renderTabBar()}

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {activeTab === 'today' && renderTodayTab()}
        {activeTab === 'library' && renderLibraryTab()}
        {activeTab === 'planner' && renderPlannerTab()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    paddingTop: theme.spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: theme.colors.primary[600],
  },
  tabText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  tabTextActive: {
    color: theme.colors.primary[700],
    fontWeight: theme.typography.fontWeight.bold,
  },
  contentContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
  todayContainer: {
    padding: theme.spacing.md,
  },
  cardSpacing: {
    marginTop: theme.spacing.md,
  },
  sectionHeader: {
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  bookmarksContainer: {
    height: 400,
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  infoCard: {
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary[600],
  },
  infoTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.fontSize.md * 1.5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  readerContainer: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  backIcon: {
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.primary[600],
    marginRight: theme.spacing.sm,
  },
  backText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary[600],
  },
  loadingCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  loadingText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },
  errorCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    ...theme.shadows.md,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  errorText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.error,
  },
});

export default QuranScreen;
