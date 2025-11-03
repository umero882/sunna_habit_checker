/**
 * Today Screen (Home)
 * Main dashboard showing prayer times, quick actions, and daily overview
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { theme } from '../../constants/theme';
import { Card } from '../../components/common';
import { PrayerCard } from '../../components/prayers';
import { PrayerPerformanceCard } from '../../components/prayers/PrayerPerformanceCard';
import { usePrayerTimes } from '../../hooks/usePrayerTimes';
import { useLocation } from '../../hooks/useLocation';
import { usePrayerLogs } from '../../hooks/usePrayerLogs';
import type { PrayerName, PrayerStatus } from '../../types';
import { format } from 'date-fns';
import { calculateDailyPerformance } from '../../utils/prayerPerformance';

import { createLogger } from '../../utils/logger';

const logger = createLogger('TodayScreen');

export const TodayScreen: React.FC = () => {
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = React.useState(false);

  // Get location data
  const {
    coordinates,
    city,
    isLoading: locationLoading,
    error: locationError,
    requestPermission,
  } = useLocation();

  // Get prayer times based on location
  const {
    prayerTimes,
    nextPrayer,
    isLoading: prayerLoading,
    error: prayerError,
    getPrayerTimeFormatted,
    refreshPrayerTimes,
  } = usePrayerTimes({
    calculationMethod: 'MuslimWorldLeague',
    asrMethod: 'Standard',
  });

  // Get prayer logs for today
  const {
    logs,
    logPrayer,
    getLogForPrayer,
    isLoading: logsLoading,
    isSyncing,
  } = usePrayerLogs({
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshPrayerTimes();
    setRefreshing(false);
  }, [refreshPrayerTimes]);

  const handleLogPrayer = async (
    prayer: PrayerName,
    status: PrayerStatus,
    jamaah?: boolean,
    fridaySunnah?: string[]
  ) => {
    try {
      await logPrayer(prayer, status, jamaah, undefined, fridaySunnah);
    } catch (error) {
      logger.error('Error logging prayer:', error);
    }
  };

  // Calculate today's performance
  const dailyPerformance = React.useMemo(() => {
    return calculateDailyPerformance(logs);
  }, [logs]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary[600]}
          />
        }
      >
        {/* Greeting Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{t('home.assalamuAlaikum')}</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Next Prayer Card */}
        <Card style={styles.prayerCard}>
          <Text style={styles.cardTitle}>{t('prayers.nextPrayer')}</Text>

          {/* Performance Display (only show if there are logs) */}
          {logs.length > 0 && !logsLoading && (
            <PrayerPerformanceCard performance={dailyPerformance} />
          )}

          {prayerLoading || locationLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary[600]} />
              <Text style={styles.loadingText}>
                {locationLoading ? 'Getting location...' : 'Calculating prayer times...'}
              </Text>
            </View>
          ) : locationError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Location permission required</Text>
              <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                <Text style={styles.permissionButtonText}>Enable Location</Text>
              </TouchableOpacity>
            </View>
          ) : nextPrayer ? (
            <>
              <View style={styles.prayerInfo}>
                <Text style={styles.prayerName}>{t(`prayers.${nextPrayer.name}`)}</Text>
                <Text style={styles.prayerTime}>{getPrayerTimeFormatted(nextPrayer.name)}</Text>
              </View>
              <View style={styles.countdown}>
                <Text style={styles.countdownText}>{nextPrayer.timeRemaining}</Text>
                <Text style={styles.countdownLabel}>{t('prayers.timeRemaining')}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.emptyText}>No upcoming prayers</Text>
          )}
        </Card>

        {/* Today's Prayer Times with Logging */}
        <View style={styles.prayersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('prayers.prayerTimes')}</Text>
            {city && <Text style={styles.locationText}>📍 {city}</Text>}
          </View>

          <View style={styles.prayersList}>
            {(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as PrayerName[]).map(prayer => {
              const log = getLogForPrayer(prayer);
              // Safely handle jamaah value: only pass if log exists and jamaah is not null
              const jamaahValue = log && log.jamaah !== null ? log.jamaah : undefined;
              return (
                <PrayerCard
                  key={prayer}
                  prayer={prayer}
                  time={prayerTimes ? getPrayerTimeFormatted(prayer) : '--:--'}
                  status={log?.status}
                  jamaah={jamaahValue}
                  onLog={(status, jamaah, fridaySunnah) =>
                    handleLogPrayer(prayer, status, jamaah, fridaySunnah)
                  }
                  disabled={!prayerTimes || isSyncing}
                />
              );
            })}
          </View>

          {!coordinates && (
            <Text style={styles.note}>
              {locationError ? '📍 Enable location for accurate times' : 'Loading location...'}
            </Text>
          )}
        </View>

        {/* Quick Log Habits */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Today's Habits</Text>
          <Text style={styles.emptyText}>Start tracking your Sunnah habits</Text>
        </Card>

        {/* What's Next Suggestion */}
        {locationError && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>{t('home.whatsNext')}</Text>
            <Text style={styles.suggestion}>
              📍 Enable location services to see accurate prayer times for your area
            </Text>
            <TouchableOpacity style={styles.actionButton} onPress={requestPermission}>
              <Text style={styles.actionButtonText}>Enable Location</Text>
            </TouchableOpacity>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    ...(Platform.OS === 'web' && {
      height: '100%',
      maxHeight: '100%',
    }),
  },
  scrollView: {
    flex: 1,
    ...(Platform.OS === 'web' && {
      height: '100%',
    }),
  },
  scrollContent: {
    padding: theme.spacing.md,
    flexGrow: 1,
    ...(Platform.OS === 'web' && {
      minHeight: '100%',
    }),
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  greeting: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  date: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },
  card: {
    marginBottom: theme.spacing.md,
  },
  prayerCard: {
    backgroundColor: theme.colors.primary[50],
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  prayerInfo: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  prayerName: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[600],
    marginBottom: theme.spacing.xs,
  },
  prayerTime: {
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.text.primary,
  },
  countdown: {
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  countdownText: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[600],
    marginBottom: theme.spacing.xs,
  },
  countdownLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  prayersSection: {
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  prayersList: {
    gap: theme.spacing.md,
  },
  note: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    paddingVertical: theme.spacing.lg,
  },
  suggestion: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    lineHeight: 24,
    marginBottom: theme.spacing.md,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  errorText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.feedback.error,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: theme.colors.primary[600],
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
  },
  permissionButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  locationText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  actionButton: {
    backgroundColor: theme.colors.primary[600],
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
    alignItems: 'center',
  },
  actionButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});

export default TodayScreen;
