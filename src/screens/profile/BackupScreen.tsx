/**
 * BackupScreen
 * Allows users to create, list, restore, and delete cloud backups
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import {
  createBackup,
  listBackups,
  restoreBackup,
  deleteBackup,
  downloadBackupFile,
  getBackupStats,
  BackupMetadata,
} from '../../services/backupService';
import { shareFile } from '../../services/exportService';
import { createLogger } from '../../utils/logger';
import { format } from 'date-fns';

const logger = createLogger('BackupScreen');

export const BackupScreen: React.FC = () => {
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [stats, setStats] = useState({
    totalBackups: 0,
    totalSizeBytes: 0,
    latestBackup: null as BackupMetadata | null,
    oldestBackup: null as BackupMetadata | null,
  });
  const [processingBackupId, setProcessingBackupId] = useState<string | null>(null);

  // Load backups on mount
  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      setIsLoading(true);
      const [backupList, backupStats] = await Promise.all([
        listBackups(),
        getBackupStats(),
      ]);
      setBackups(backupList);
      setStats(backupStats);
    } catch (error: any) {
      logger.error('Error loading backups:', error);
      Alert.alert('Error', 'Failed to load backups');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await loadBackups();
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleCreateBackup = async () => {
    Alert.prompt(
      'Create Backup',
      'Enter a name for this backup (optional):',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Create',
          onPress: async (backupName?: string) => {
            try {
              setIsCreatingBackup(true);
              await createBackup(backupName);
              Alert.alert('Success', 'Backup created successfully!');
              await loadBackups();
            } catch (error: any) {
              logger.error('Error creating backup:', error);
              Alert.alert('Error', error.message || 'Failed to create backup');
            } finally {
              setIsCreatingBackup(false);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleRestoreBackup = async (backupId: string) => {
    Alert.alert(
      'Restore Backup',
      'This will replace all your current data with the backup. This action cannot be undone. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingBackupId(backupId);
              await restoreBackup(backupId);
              Alert.alert(
                'Success',
                'Backup restored successfully! Please restart the app to see changes.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Could add app restart logic here
                    },
                  },
                ]
              );
            } catch (error: any) {
              logger.error('Error restoring backup:', error);
              Alert.alert('Error', error.message || 'Failed to restore backup');
            } finally {
              setProcessingBackupId(null);
            }
          },
        },
      ]
    );
  };

  const handleDeleteBackup = async (backupId: string) => {
    Alert.alert(
      'Delete Backup',
      'Are you sure you want to delete this backup? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingBackupId(backupId);
              await deleteBackup(backupId);
              Alert.alert('Success', 'Backup deleted successfully');
              await loadBackups();
            } catch (error: any) {
              logger.error('Error deleting backup:', error);
              Alert.alert('Error', error.message || 'Failed to delete backup');
            } finally {
              setProcessingBackupId(null);
            }
          },
        },
      ]
    );
  };

  const handleDownloadBackup = async (backupId: string) => {
    try {
      setProcessingBackupId(backupId);
      const fileUri = await downloadBackupFile(backupId);

      // Try to share the file
      try {
        await shareFile(fileUri);
        Alert.alert(
          'Success',
          'Backup file downloaded successfully!',
          [{ text: 'OK' }]
        );
      } catch (shareError: any) {
        // If sharing fails, show the file location
        logger.warn('Sharing failed, file saved locally:', shareError);
        Alert.alert(
          'File Saved',
          `Backup file saved locally.\n\nLocation: ${fileUri}\n\nYou can access it through your file manager.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      logger.error('Error downloading backup:', error);
      Alert.alert('Error', error.message || 'Failed to download backup');
    } finally {
      setProcessingBackupId(null);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[600]} />
        <Text style={styles.loadingText}>Loading backups...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
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
        <Ionicons name="cloud-upload-outline" size={48} color={theme.colors.primary[600]} />
        <Text style={styles.headerTitle}>Backup & Restore</Text>
        <Text style={styles.headerSubtitle}>
          Safely backup your data to the cloud and restore it anytime
        </Text>
      </View>

      {/* Statistics Card */}
      <View style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="cloud-outline" size={24} color={theme.colors.primary[600]} />
            <Text style={styles.statValue}>{stats.totalBackups}</Text>
            <Text style={styles.statLabel}>Backups</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="archive-outline" size={24} color={theme.colors.secondary[600]} />
            <Text style={styles.statValue}>{formatBytes(stats.totalSizeBytes)}</Text>
            <Text style={styles.statLabel}>Total Size</Text>
          </View>
        </View>
      </View>

      {/* Create Backup Button */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={handleCreateBackup}
        disabled={isCreatingBackup}
      >
        {isCreatingBackup ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
            <Text style={styles.createButtonText}>Create New Backup</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Backup List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Backups</Text>

        {backups.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cloud-offline-outline" size={64} color={theme.colors.text.tertiary} />
            <Text style={styles.emptyStateTitle}>No Backups Yet</Text>
            <Text style={styles.emptyStateText}>
              Create your first backup to safely store your data in the cloud
            </Text>
          </View>
        ) : (
          backups.map((backup) => (
            <View key={backup.id} style={styles.backupCard}>
              <View style={styles.backupHeader}>
                <View style={styles.backupIcon}>
                  <Ionicons name="archive" size={24} color={theme.colors.primary[600]} />
                </View>
                <View style={styles.backupInfo}>
                  <Text style={styles.backupName}>{backup.backup_name}</Text>
                  <Text style={styles.backupDate}>{formatDate(backup.created_at)}</Text>
                  <View style={styles.backupMeta}>
                    <Text style={styles.backupSize}>{formatBytes(backup.size_bytes)}</Text>
                    <Text style={styles.backupVersion}>v{backup.version}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.backupActions}>
                {/* Restore Button */}
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleRestoreBackup(backup.id)}
                  disabled={processingBackupId === backup.id}
                >
                  {processingBackupId === backup.id ? (
                    <ActivityIndicator size="small" color={theme.colors.primary[600]} />
                  ) : (
                    <>
                      <Ionicons name="refresh" size={20} color={theme.colors.primary[600]} />
                      <Text style={styles.actionButtonText}>Restore</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Download Button */}
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDownloadBackup(backup.id)}
                  disabled={processingBackupId === backup.id}
                >
                  <Ionicons name="download-outline" size={20} color={theme.colors.info} />
                  <Text style={[styles.actionButtonText, { color: theme.colors.info }]}>
                    Download
                  </Text>
                </TouchableOpacity>

                {/* Delete Button */}
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteBackup(backup.id)}
                  disabled={processingBackupId === backup.id}
                >
                  <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                  <Text style={[styles.actionButtonText, { color: theme.colors.error }]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={24} color={theme.colors.info} />
        <Text style={styles.infoTitle}>About Backups</Text>
        <Text style={styles.infoText}>
          • Backups are stored securely in the cloud
        </Text>
        <Text style={styles.infoText}>
          • All your prayers, Sunnah habits, and Quran progress are included
        </Text>
        <Text style={styles.infoText}>
          • Restore on any device by logging in with the same account
        </Text>
        <Text style={styles.infoText}>
          • Create regular backups to prevent data loss
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
  },
  loadingText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
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
    marginBottom: theme.spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.sm,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary[600],
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.xl,
  },
  createButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: '#FFFFFF',
    marginLeft: theme.spacing.sm,
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
  emptyState: {
    alignItems: 'center',
    padding: theme.spacing.xxl,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
  },
  emptyStateTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyStateText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  backupCard: {
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  backupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  backupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  backupInfo: {
    flex: 1,
  },
  backupName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  backupDate: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  backupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backupSize: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    marginRight: theme.spacing.sm,
  },
  backupVersion: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
  },
  backupActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.primary,
  },
  actionButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.primary[600],
    marginLeft: 4,
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
