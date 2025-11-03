/**
 * ExportDataScreen
 * Allows users to export their prayer logs, Sunnah habits, and Quran progress to CSV
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import {
  exportPrayerLogs,
  exportSunnahLogs,
  exportQuranProgress,
  exportAllData,
  shareFile,
  shareMultipleFiles,
  getExportStats,
} from '../../services/exportService';
import { createLogger } from '../../utils/logger';
import { format, subMonths } from 'date-fns';

const logger = createLogger('ExportDataScreen');

type ExportType = 'prayers' | 'sunnah' | 'quran' | 'all';

export const ExportDataScreen: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportingType, setExportingType] = useState<ExportType | null>(null);
  const [stats, setStats] = useState({
    prayerLogsCount: 0,
    sunnahLogsCount: 0,
    quranProgressCount: 0,
    totalRecords: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Load export statistics
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoadingStats(true);
      const data = await getExportStats();
      setStats(data);
    } catch (error: any) {
      logger.error('Error loading stats:', error);
      Alert.alert('Error', 'Failed to load export statistics');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleExport = async (type: ExportType, dateRange?: { start?: string; end?: string }) => {
    try {
      setIsExporting(true);
      setExportingType(type);

      let fileUris: string[] = [];

      switch (type) {
        case 'prayers':
          const prayerUri = await exportPrayerLogs(dateRange?.start, dateRange?.end);
          fileUris = [prayerUri];
          break;

        case 'sunnah':
          const sunnahUri = await exportSunnahLogs(dateRange?.start, dateRange?.end);
          fileUris = [sunnahUri];
          break;

        case 'quran':
          const quranUri = await exportQuranProgress();
          fileUris = [quranUri];
          break;

        case 'all':
          fileUris = await exportAllData(dateRange?.start, dateRange?.end);
          break;
      }

      // Share the file(s)
      if (fileUris.length === 1) {
        await shareFile(fileUris[0]);
      } else {
        await shareMultipleFiles(fileUris);
      }

      Alert.alert(
        'Success',
        `Your ${type === 'all' ? 'data' : type} ${fileUris.length > 1 ? 'files have' : 'file has'} been exported successfully!`
      );
    } catch (error: any) {
      logger.error(`Error exporting ${type}:`, error);
      Alert.alert('Export Failed', error.message || `Failed to export ${type} data`);
    } finally {
      setIsExporting(false);
      setExportingType(null);
    }
  };

  const showDateRangeOptions = (type: ExportType) => {
    const now = new Date();
    const options = [
      {
        label: 'Last 30 Days',
        start: format(subMonths(now, 1), 'yyyy-MM-dd'),
        end: format(now, 'yyyy-MM-dd'),
      },
      {
        label: 'Last 3 Months',
        start: format(subMonths(now, 3), 'yyyy-MM-dd'),
        end: format(now, 'yyyy-MM-dd'),
      },
      {
        label: 'Last 6 Months',
        start: format(subMonths(now, 6), 'yyyy-MM-dd'),
        end: format(now, 'yyyy-MM-dd'),
      },
      {
        label: 'All Time',
        start: undefined,
        end: undefined,
      },
    ];

    const buttons: any[] = options.map((option) => ({
      text: option.label,
      onPress: () => handleExport(type, { start: option.start, end: option.end }),
    }));
    buttons.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert(
      'Select Date Range',
      'Choose the date range for export',
      buttons
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="download-outline" size={48} color={theme.colors.primary[600]} />
        <Text style={styles.headerTitle}>Export Your Data</Text>
        <Text style={styles.headerSubtitle}>
          Download your prayer logs, Sunnah habits, and Quran progress as CSV files for backup or
          analysis
        </Text>
      </View>

      {/* Statistics Card */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Available Data</Text>

        {isLoadingStats ? (
          <ActivityIndicator size="small" color={theme.colors.primary[600]} />
        ) : (
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Ionicons name="book-outline" size={24} color={theme.colors.primary[600]} />
              <Text style={styles.statValue}>{stats.prayerLogsCount.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Prayer Logs</Text>
            </View>

            <View style={styles.statItem}>
              <Ionicons name="sunny-outline" size={24} color={theme.colors.secondary[600]} />
              <Text style={styles.statValue}>{stats.sunnahLogsCount.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Sunnah Logs</Text>
            </View>

            <View style={styles.statItem}>
              <Ionicons name="book" size={24} color={theme.colors.info} />
              <Text style={styles.statValue}>{stats.quranProgressCount.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Quran Progress</Text>
            </View>

            <View style={styles.statItem}>
              <Ionicons name="albums-outline" size={24} color={theme.colors.text.secondary} />
              <Text style={styles.statValue}>{stats.totalRecords.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total Records</Text>
            </View>
          </View>
        )}
      </View>

      {/* Export Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Export Options</Text>

        {/* Prayer Logs */}
        <TouchableOpacity
          style={styles.exportCard}
          onPress={() => showDateRangeOptions('prayers')}
          disabled={isExporting || stats.prayerLogsCount === 0}
        >
          <View style={styles.exportIcon}>
            <Ionicons name="book-outline" size={28} color={theme.colors.primary[600]} />
          </View>
          <View style={styles.exportContent}>
            <Text style={styles.exportTitle}>Prayer Logs</Text>
            <Text style={styles.exportDescription}>
              Export all your prayer tracking data including times, status, and notes
            </Text>
          </View>
          {isExporting && exportingType === 'prayers' ? (
            <ActivityIndicator size="small" color={theme.colors.primary[600]} />
          ) : (
            <Ionicons name="chevron-forward" size={24} color={theme.colors.text.tertiary} />
          )}
        </TouchableOpacity>

        {/* Sunnah Habits */}
        <TouchableOpacity
          style={styles.exportCard}
          onPress={() => showDateRangeOptions('sunnah')}
          disabled={isExporting || stats.sunnahLogsCount === 0}
        >
          <View style={[styles.exportIcon, { backgroundColor: theme.colors.secondary[50] }]}>
            <Ionicons name="sunny-outline" size={28} color={theme.colors.secondary[600]} />
          </View>
          <View style={styles.exportContent}>
            <Text style={styles.exportTitle}>Sunnah Habits</Text>
            <Text style={styles.exportDescription}>
              Export your Sunnah practice logs with completion levels and notes
            </Text>
          </View>
          {isExporting && exportingType === 'sunnah' ? (
            <ActivityIndicator size="small" color={theme.colors.secondary[600]} />
          ) : (
            <Ionicons name="chevron-forward" size={24} color={theme.colors.text.tertiary} />
          )}
        </TouchableOpacity>

        {/* Quran Progress */}
        <TouchableOpacity
          style={styles.exportCard}
          onPress={() => handleExport('quran')}
          disabled={isExporting || stats.quranProgressCount === 0}
        >
          <View style={[styles.exportIcon, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="book" size={28} color={theme.colors.info} />
          </View>
          <View style={styles.exportContent}>
            <Text style={styles.exportTitle}>Quran Progress</Text>
            <Text style={styles.exportDescription}>
              Export your Quran reading progress and completed verses
            </Text>
          </View>
          {isExporting && exportingType === 'quran' ? (
            <ActivityIndicator size="small" color={theme.colors.info} />
          ) : (
            <Ionicons name="chevron-forward" size={24} color={theme.colors.text.tertiary} />
          )}
        </TouchableOpacity>

        {/* All Data */}
        <TouchableOpacity
          style={[styles.exportCard, styles.exportCardPrimary]}
          onPress={() => showDateRangeOptions('all')}
          disabled={isExporting || stats.totalRecords === 0}
        >
          <View style={[styles.exportIcon, { backgroundColor: theme.colors.primary[600] }]}>
            <Ionicons name="albums-outline" size={28} color="#FFFFFF" />
          </View>
          <View style={styles.exportContent}>
            <Text style={[styles.exportTitle, { color: '#FFFFFF' }]}>Export All Data</Text>
            <Text style={[styles.exportDescription, { color: 'rgba(255, 255, 255, 0.8)' }]}>
              Download all your prayer, Sunnah, and Quran data in one go
            </Text>
          </View>
          {isExporting && exportingType === 'all' ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="chevron-forward" size={24} color="rgba(255, 255, 255, 0.8)" />
          )}
        </TouchableOpacity>
      </View>

      {/* Info Section */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={24} color={theme.colors.info} />
        <Text style={styles.infoTitle}>About CSV Export</Text>
        <Text style={styles.infoText}>
          • CSV files can be opened in Excel, Google Sheets, or any spreadsheet software
        </Text>
        <Text style={styles.infoText}>
          • Your data remains private and is only stored on your device
        </Text>
        <Text style={styles.infoText}>
          • Use exported data for personal backup, analysis, or migration
        </Text>
        <Text style={styles.infoText}>
          • Files include all relevant details like dates, status, and notes
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  contentContainer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  statsCard: {
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.xl,
  },
  statsTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.md,
  },
  statValue: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.sm,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  exportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  exportCardPrimary: {
    backgroundColor: theme.colors.primary[600],
    borderColor: theme.colors.primary[700],
  },
  exportIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  exportContent: {
    flex: 1,
  },
  exportTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  exportDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.info,
  },
  infoTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  infoText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 22,
    marginBottom: theme.spacing.sm,
  },
});
