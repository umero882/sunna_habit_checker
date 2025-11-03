/**
 * Prayers Screen
 * Full prayer tracker with today's prayers and statistics
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types';
import { theme } from '../constants/theme';
import { usePrayerTimes } from '../hooks/usePrayerTimes';
import { usePrayerLogs } from '../hooks/usePrayerLogs';
import { usePrayerStats } from '../hooks/usePrayerStats';
import { PrayerCard } from '../components/prayers/PrayerCard';
import { NextPrayerCard } from '../components/home/NextPrayerCard';
import { PrayerCalendar } from '../components/prayers/PrayerCalendar';
import { StatsCards } from '../components/prayers/StatsCards';
import { StreakCard } from '../components/prayers/StreakCard';
import type { PrayerName, PrayerStatus } from '../types';
import type { HeatmapDay } from '../components/prayers/PrayerCalendar';
import { format } from 'date-fns';

import { createLogger } from '../utils/logger';
import { ProfileAvatar } from '../components/common/ProfileAvatar';

const logger = createLogger('PrayersScreen');

type NavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

export const PrayersScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const today = format(new Date(), 'yyyy-MM-dd');

  // Fetch prayer times
  const {
    nextPrayer,
    prayerTimes,
    getPrayerTimeFormatted,
    isLoading: timesLoading,
    refreshPrayerTimes,
  } = usePrayerTimes();

  // Fetch prayer logs for today
  const {
    logs,
    isLoading: logsLoading,
    error,
    logPrayer,
    refreshLogs,
  } = usePrayerLogs({ date: today });

  // Fetch prayer statistics
  const {
    stats,
    isLoading: statsLoading,
    error: statsError,
    refresh: refreshStats,
  } = usePrayerStats({ days: 30 });

  const isLoading = timesLoading || logsLoading;

  // Fade in animation on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Get prayer log for a specific prayer (memoized)
  const getPrayerLog = useCallback(
    (prayerName: PrayerName) => {
      return logs.find(log => log.prayer === prayerName);
    },
    [logs]
  );

  // Calculate daily stats (memoized)
  const dailyStats = useMemo(() => {
    const totalPrayers = 5;
    const logged = logs.length;
    const onTime = logs.filter(log => log.status === 'on_time').length;
    const inJamaah = logs.filter(log => log.jamaah === true).length;

    return {
      total: totalPrayers,
      logged,
      onTime,
      inJamaah,
      completion: totalPrayers > 0 ? Math.round((logged / totalPrayers) * 100) : 0,
    };
  }, [logs]);

  // Show loading only when we don't have prayer times yet
  const showLoading = !prayerTimes && isLoading;

  // Handle logging a prayer with better error handling and feedback
  const handleLogPrayer = useCallback(
    async (
      prayerName: PrayerName,
      status: PrayerStatus,
      jamaah?: boolean,
      fridaySunnah?: string[]
    ) => {
      try {
        await logPrayer(prayerName, status, jamaah, undefined, fridaySunnah);

        // Show success message
        const prayerLabel = prayerName.charAt(0).toUpperCase() + prayerName.slice(1);
        const statusLabel = status === 'on_time' ? 'on time' : status;
        setSuccessMessage(`${prayerLabel} logged as ${statusLabel}${jamaah ? ' in Jamaah' : ''}!`);

        // Auto-hide after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err) {
        logger.error('Error logging prayer:', err);
        Alert.alert('Error', 'Failed to log prayer. Please check your connection and try again.', [
          { text: 'OK' },
        ]);
      }
    },
    [logPrayer]
  );

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshPrayerTimes(), refreshLogs(), refreshStats()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshPrayerTimes, refreshLogs, refreshStats]);

  // Handle day press on calendar
  const handleDayPress = useCallback((day: HeatmapDay) => {
    Alert.alert(
      format(new Date(day.date), 'MMMM d, yyyy'),
      `Prayers logged: ${day.count}/5\nCompletion: ${day.level * 25}%`,
      [{ text: 'OK' }]
    );
  }, []);

  // Prepare prayer times data for NextPrayerCard (memoized)
  const allPrayerTimes = useMemo(
    () =>
      prayerTimes
        ? [
            { name: 'fajr' as const, time: getPrayerTimeFormatted('fajr'), date: prayerTimes.fajr },
            {
              name: 'dhuhr' as const,
              time: getPrayerTimeFormatted('dhuhr'),
              date: prayerTimes.dhuhr,
            },
            { name: 'asr' as const, time: getPrayerTimeFormatted('asr'), date: prayerTimes.asr },
            {
              name: 'maghrib' as const,
              time: getPrayerTimeFormatted('maghrib'),
              date: prayerTimes.maghrib,
            },
            { name: 'isha' as const, time: getPrayerTimeFormatted('isha'), date: prayerTimes.isha },
          ]
        : [],
    [prayerTimes, getPrayerTimeFormatted]
  );

  // Convert nextPrayer to match NextPrayerCard interface (memoized)
  const nextPrayerInfo = useMemo(
    () =>
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

  if (showLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[600]} />
        <Text style={styles.loadingText}>Loading prayers...</Text>
      </View>
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Prayer Tracker</Text>
            <Text style={styles.date}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</Text>
          </View>
          <ProfileAvatar size={44} />
        </View>

        {/* Success Toast */}
        {successMessage && (
          <Animated.View style={styles.successToast}>
            <Text style={styles.successText}>✓ {successMessage}</Text>
          </Animated.View>
        )}

        {/* Daily Summary Card */}
        {logs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Today's Summary</Text>
              <View style={styles.summaryStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {dailyStats.logged}/{dailyStats.total}
                  </Text>
                  <Text style={styles.statLabel}>Logged</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{dailyStats.onTime}</Text>
                  <Text style={styles.statLabel}>On Time</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{dailyStats.inJamaah}</Text>
                  <Text style={styles.statLabel}>Jamaah</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{dailyStats.completion}%</Text>
                  <Text style={styles.statLabel}>Complete</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Next Prayer Card */}
        <View style={styles.section}>
          <NextPrayerCard nextPrayer={nextPrayerInfo} prayerTimes={allPrayerTimes} />
        </View>

        {/* Qibla Compass Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.qiblaButton} onPress={() => navigation.navigate('Qibla')}>
            <View style={styles.qiblaIcon}>
              <Ionicons name="compass" size={32} color={theme.colors.primary[600]} />
            </View>
            <View style={styles.qiblaTextContainer}>
              <Text style={styles.qiblaTitle}>Find Qibla Direction</Text>
              <Text style={styles.qiblaSubtitle}>Use compass to locate Kaaba</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* Streak Card - Moved to top for better visibility */}
        {stats && !statsLoading && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Streak</Text>
            <StreakCard streak={stats.streak} />
          </View>
        )}

        {/* Today's Prayers Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Prayers</Text>
          <View style={styles.prayersList}>
            {(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as PrayerName[]).map(prayer => {
              const log = getPrayerLog(prayer);
              const jamaahValue = log && log.jamaah !== null ? log.jamaah : undefined;

              return (
                <View key={prayer} style={styles.prayerCardWrapper}>
                  <PrayerCard
                    prayer={prayer}
                    time={getPrayerTimeFormatted(prayer)}
                    status={log?.status}
                    jamaah={jamaahValue}
                    onLog={(status, jamaah, fridaySunnah) =>
                      handleLogPrayer(prayer, status, jamaah, fridaySunnah)
                    }
                  />
                </View>
              );
            })}
          </View>
        </View>

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Prayer Statistics Section */}
        {stats && !statsLoading && (
          <>
            {/* Weekly and Monthly Stats */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Statistics</Text>
              <StatsCards weekly={stats.weekly} monthly={stats.monthly} />
            </View>

            {/* Prayer Calendar Heatmap */}
            <View style={styles.section}>
              <PrayerCalendar data={stats.heatmapData} onDayPress={handleDayPress} />
            </View>
          </>
        )}

        {/* Stats Loading State */}
        {statsLoading && (
          <View style={styles.section}>
            <View style={styles.statsLoadingCard}>
              <ActivityIndicator size="small" color={theme.colors.primary[600]} />
              <Text style={styles.statsLoadingText}>Loading statistics...</Text>
            </View>
          </View>
        )}

        {/* Stats Error State */}
        {statsError && !statsLoading && (
          <View style={styles.section}>
            <View style={styles.statsErrorCard}>
              <Text style={styles.statsErrorText}>
                Unable to load statistics. Pull to refresh to try again.
              </Text>
            </View>
          </View>
        )}

        {/* Empty State for first time - Moved to bottom */}
        {logs.length === 0 && !isLoading && (
          <View style={styles.section}>
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateIcon}>🕌</Text>
              <Text style={styles.emptyStateTitle}>Start Tracking Your Prayers</Text>
              <Text style={styles.emptyStateText}>
                Tap on any prayer above to log it and start building your prayer habit tracker!
              </Text>
            </View>
          </View>
        )}

        {/* Bottom spacing */}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  headerTextContainer: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  date: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },
  successToast: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.success,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.md,
  },
  successText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.background.primary,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: theme.colors.background.primary,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
  },
  summaryTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[600],
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.border.light,
  },
  section: {
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  prayersList: {
    gap: theme.spacing.md,
  },
  prayerCardWrapper: {
    // Wrapper for consistent spacing
  },
  errorContainer: {
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.error + '20',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  errorText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.error,
    textAlign: 'center',
  },
  emptyStateCard: {
    backgroundColor: theme.colors.background.primary,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyStateTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  statsLoadingCard: {
    backgroundColor: theme.colors.background.primary,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  statsLoadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  statsErrorCard: {
    backgroundColor: theme.colors.background.primary,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.error + '30',
    ...theme.shadows.sm,
  },
  statsErrorText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  qiblaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
  },
  qiblaIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  qiblaTextContainer: {
    flex: 1,
  },
  qiblaTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  qiblaSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  bottomSpacer: {
    height: theme.spacing.xl,
  },
});

export default PrayersScreen;
