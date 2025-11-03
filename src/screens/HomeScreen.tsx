/**
 * Home Screen
 * Central dashboard showing today's summary
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Text, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../types';
import { theme } from '../constants/theme';
import { usePrayerTimes } from '../hooks/usePrayerTimes';
import { useTodayStats } from '../hooks/useTodayStats';
import { useKhushuTracking } from '../hooks/useKhushuTracking';
import { useProfile } from '../hooks/useProfile';
import {
  GreetingHeader,
  HadithCard,
  DailyProgressBar,
  QuickActionTiles,
  NextPrayerCard,
  ReflectionStrip
} from '../components/home';
import { PRAYER_STATUS_HADITH } from '../constants/hadith';
import { createLogger } from '../utils/logger';

const logger = createLogger('HomeScreen');

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Fetch prayer times and stats
  const {
    nextPrayer,
    prayerTimes,
    isLoading: prayerLoading,
    error: prayerError,
    refreshPrayerTimes,
    getPrayerTimeFormatted,
  } = usePrayerTimes();
  const { stats, isLoading: statsLoading, error: statsError, refresh: refreshStats } = useTodayStats();
  const { khushuLevel, saveKhushuLevel, refreshKhushuLevel } = useKhushuTracking();
  const { getDisplayName, isLoading: profileLoading } = useProfile();

  const isLoading = prayerLoading || statsLoading || profileLoading;
  const hasError = prayerError || statsError;

  // Get user's display name (extracted from email or metadata)
  const displayName = useMemo(() => getDisplayName(), [getDisplayName]);

  // Get a random "on_time" hadith for daily display (memoized)
  const dailyHadith = useMemo(() => {
    const hadiths = PRAYER_STATUS_HADITH.on_time;
    const randomIndex = Math.floor(Math.random() * hadiths.length);
    return hadiths[randomIndex];
  }, []);

  // Prepare prayer times data for NextPrayerCard (memoized)
  const allPrayerTimes = useMemo(() =>
    prayerTimes
      ? [
          { name: 'fajr' as const, time: getPrayerTimeFormatted('fajr'), date: prayerTimes.fajr },
          { name: 'dhuhr' as const, time: getPrayerTimeFormatted('dhuhr'), date: prayerTimes.dhuhr },
          { name: 'asr' as const, time: getPrayerTimeFormatted('asr'), date: prayerTimes.asr },
          { name: 'maghrib' as const, time: getPrayerTimeFormatted('maghrib'), date: prayerTimes.maghrib },
          { name: 'isha' as const, time: getPrayerTimeFormatted('isha'), date: prayerTimes.isha },
        ]
      : [],
    [prayerTimes, getPrayerTimeFormatted]
  );

  // Convert nextPrayer to match NextPrayerCard interface (memoized)
  const nextPrayerInfo = useMemo(() =>
    nextPrayer
      ? {
          name: nextPrayer.name,
          time: getPrayerTimeFormatted(nextPrayer.name),
          date: nextPrayer.time,
          timeRemaining: nextPrayer.timeRemaining,
        }
      : null,
    [nextPrayer, getPrayerTimeFormatted]
  );

  // Fade in animation on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshPrayerTimes(), refreshStats(), refreshKhushuLevel()]);
    } catch (error) {
      logger.error('Error refreshing:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshPrayerTimes, refreshStats, refreshKhushuLevel]);

  const handleSettingsPress = useCallback(() => {
    // Navigate to Profile tab (contains settings)
    navigation.navigate('ProfileTab');
  }, [navigation]);

  const handleProgressPress = useCallback((category: 'prayer' | 'quran' | 'sunnah' | 'charity') => {
    // Navigate to respective tab
    const tabMap = {
      prayer: 'PrayersTab',
      quran: 'QuranTab',
      sunnah: 'SunnahTab',
      charity: 'ProfileTab', // Charity is in Profile for now
    };

    navigation.navigate(tabMap[category] as keyof MainTabParamList);
  }, [navigation]);

  const handleLearnMore = useCallback(() => {
    // Navigate to Sunnah tab for more hadith
    navigation.navigate('SunnahTab');
  }, [navigation]);

  const handleQuickAction = useCallback((action: string) => {
    logger.debug('Quick action:', action);
    // TODO: Implement quick action handlers
  }, []);

  const handleLogPrayer = useCallback(() => {
    navigation.navigate('PrayersTab');
  }, [navigation]);

  const handleViewAllPrayers = useCallback(() => {
    navigation.navigate('PrayersTab');
  }, [navigation]);

  const handleKhushuChange = useCallback(async (value: number) => {
    try {
      await saveKhushuLevel(value);
    } catch (error) {
      logger.error('Failed to save Khushu level:', error);
    }
  }, [saveKhushuLevel]);

  const handleJournalPress = useCallback(() => {
    logger.debug('Journal pressed');
    // TODO: Navigate to journal/reflection screen
  }, []);

  // Enhanced loading state
  if (isLoading && !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[600]} />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
        <Text style={styles.loadingSubtext}>Fetching prayer times and stats</Text>
      </View>
    );
  }

  // Error state
  if (hasError && !stats) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.errorContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary[600]}
          />
        }
      >
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Unable to Load Dashboard</Text>
        <Text style={styles.errorMessage}>
          {prayerError || statsError || 'Something went wrong. Pull down to refresh.'}
        </Text>
      </ScrollView>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary[600]}
          />
        }
      >
        {/* Greeting Header */}
        <GreetingHeader
          userName={displayName}
          nextPrayer={nextPrayer}
          pendingSunnahCount={stats.sunnah.totalHabits - stats.sunnah.habitsCompleted}
          onSettingsPress={handleSettingsPress}
        />

        {/* Daily Progress */}
        <DailyProgressBar
          stats={stats}
          onPressCategory={handleProgressPress}
        />

        {/* Next Prayer Card with Countdown */}
        <View style={styles.section}>
          <NextPrayerCard
            nextPrayer={nextPrayerInfo}
            prayerTimes={allPrayerTimes}
            onLogPress={handleLogPrayer}
            onViewAllPress={handleViewAllPrayers}
          />
        </View>

        {/* Quick Action Tiles */}
        <View style={styles.section}>
          <QuickActionTiles
            onPrayerLog={() => navigation.navigate('PrayersTab')}
            onMorningAdhkar={() => navigation.navigate('SunnahTab')}
            onReadQuran={() => navigation.navigate('QuranTab')}
            onSadaqah={() => navigation.navigate('ProfileTab')}
            onFasting={() => handleQuickAction('fasting')}
            onDhikr={() => navigation.navigate('SunnahTab')}
          />
        </View>

        {/* Hadith of the Day */}
        <View style={styles.section}>
          <HadithCard
            hadith={dailyHadith}
            onLearnMore={handleLearnMore}
          />
        </View>

        {/* Reflection & Khushu Strip */}
        <View style={styles.section}>
          <ReflectionStrip
            initialKhushu={khushuLevel}
            onKhushuChange={handleKhushuChange}
            onJournalPress={handleJournalPress}
          />
        </View>

        {/* Bottom spacing for safe area */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: theme.spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },
  loadingSubtext: {
    marginTop: theme.spacing.sm,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  errorTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  bottomSpacer: {
    height: theme.spacing.xl,
  },
});

export default HomeScreen;
