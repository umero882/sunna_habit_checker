/**
 * Backup Service
 * Handles backing up and restoring user data to/from cloud storage (Supabase Storage)
 */

import * as FileSystem from 'expo-file-system';
import { supabase, getCurrentUser } from './supabase';
import { format } from 'date-fns';
import { createLogger } from '../utils/logger';

const logger = createLogger('backupService');

export interface BackupMetadata {
  id: string;
  user_id: string;
  backup_name: string;
  created_at: string;
  size_bytes: number;
  data_types: string[];
  version: string;
}

export interface BackupData {
  version: string;
  created_at: string;
  user_id: string;
  prayer_logs: any[];
  sunnah_logs: any[];
  quran_progress: any[];
  user_profile: any;
  settings: any;
}

const BACKUP_VERSION = '1.0.0';
const BACKUP_BUCKET = 'user-backups';

/**
 * Fetch all user data for backup
 */
const fetchUserData = async (): Promise<Omit<BackupData, 'version' | 'created_at'>> => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Fetch prayer logs
  const { data: prayerLogs, error: prayerError } = await supabase
    .from('prayer_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (prayerError) throw prayerError;

  // Fetch sunnah logs with habit details
  const { data: sunnahLogs, error: sunnahError } = await supabase
    .from('sunnah_logs')
    .select(`
      *,
      sunnah_habits (
        name,
        category,
        description
      )
    `)
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (sunnahError) throw sunnahError;

  // Fetch quran progress
  const { data: quranProgress, error: quranError } = await supabase
    .from('quran_progress')
    .select('*')
    .eq('user_id', user.id)
    .order('last_read_at', { ascending: false });

  if (quranError) throw quranError;

  // Fetch user profile
  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    // PGRST116 = no rows returned (profile doesn't exist yet)
    throw profileError;
  }

  // Fetch user settings (if you have a settings table)
  const { data: settings, error: settingsError } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (settingsError && settingsError.code !== 'PGRST116') {
    throw settingsError;
  }

  return {
    user_id: user.id,
    prayer_logs: prayerLogs || [],
    sunnah_logs: sunnahLogs || [],
    quran_progress: quranProgress || [],
    user_profile: userProfile || null,
    settings: settings || null,
  };
};

/**
 * Create a backup of all user data
 */
export const createBackup = async (backupName?: string): Promise<BackupMetadata> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Fetch all user data
    const userData = await fetchUserData();

    // Create backup object
    const backupData: BackupData = {
      version: BACKUP_VERSION,
      created_at: new Date().toISOString(),
      ...userData,
    };

    // Convert to JSON
    const backupJson = JSON.stringify(backupData, null, 2);
    const backupSizeBytes = new Blob([backupJson]).size;

    // Generate backup filename
    const timestamp = format(new Date(), 'yyyy-MM-dd_HHmmss');
    // Clean the backup name to prevent invalid characters in filename
    const cleanBackupName = backupName?.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = cleanBackupName
      ? `${cleanBackupName}_${timestamp}.json`
      : `backup_${timestamp}.json`;

    // Save to local file first
    const fileUri = `${(FileSystem as any).documentDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(fileUri, backupJson, {
      encoding: (FileSystem as any).EncodingType.UTF8,
    });

    // Read the file as base64 for upload
    const base64Data = await FileSystem.readAsStringAsync(fileUri, {
      encoding: (FileSystem as any).EncodingType.Base64,
    });

    // Convert base64 to Uint8Array for Supabase
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Upload to Supabase Storage
    const storagePath = `${user.id}/${filename}`;
    const { error: uploadError } = await supabase.storage
      .from(BACKUP_BUCKET)
      .upload(storagePath, binaryData, {
        contentType: 'application/json',
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Save backup metadata
    const metadata: Omit<BackupMetadata, 'id' | 'created_at'> = {
      user_id: user.id,
      backup_name: backupName || `Backup ${timestamp}`,
      size_bytes: backupSizeBytes,
      data_types: ['prayers', 'sunnah', 'quran', 'profile', 'settings'],
      version: BACKUP_VERSION,
    };

    const { data: metadataRecord, error: metadataError } = await supabase
      .from('backup_metadata')
      .insert(metadata)
      .select()
      .single();

    if (metadataError) {
      throw metadataError;
    }

    // Clean up local file
    await FileSystem.deleteAsync(fileUri, { idempotent: true });

    logger.info(`Backup created: ${filename}`);

    return metadataRecord;
  } catch (error: any) {
    logger.error('Error creating backup:', error);
    throw error;
  }
};

/**
 * List all backups for the current user
 */
export const listBackups = async (): Promise<BackupMetadata[]> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('backup_metadata')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error: any) {
    logger.error('Error listing backups:', error);
    throw error;
  }
};

/**
 * Download and restore a backup
 */
export const restoreBackup = async (backupId: string): Promise<void> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get backup metadata
    const { data: metadata, error: metadataError } = await supabase
      .from('backup_metadata')
      .select('*')
      .eq('id', backupId)
      .eq('user_id', user.id)
      .single();

    if (metadataError) {
      throw metadataError;
    }

    if (!metadata) {
      throw new Error('Backup not found');
    }

    // Download backup file from Supabase Storage
    const storagePath = `${user.id}/${metadata.backup_name}`;
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(BACKUP_BUCKET)
      .download(storagePath);

    if (downloadError) {
      throw downloadError;
    }

    // Convert blob to JSON
    const backupText = await fileData.text();
    const backupData: BackupData = JSON.parse(backupText);

    // Verify backup version
    if (backupData.version !== BACKUP_VERSION) {
      logger.warn(`Backup version mismatch: ${backupData.version} vs ${BACKUP_VERSION}`);
      // Could add migration logic here if needed
    }

    // Restore prayer logs
    if (backupData.prayer_logs && backupData.prayer_logs.length > 0) {
      // Delete existing prayer logs
      await supabase
        .from('prayer_logs')
        .delete()
        .eq('user_id', user.id);

      // Insert backup prayer logs
      const { error: prayerError } = await supabase
        .from('prayer_logs')
        .insert(backupData.prayer_logs.map(log => ({
          ...log,
          user_id: user.id, // Ensure user_id is correct
        })));

      if (prayerError) throw prayerError;
    }

    // Restore sunnah logs
    if (backupData.sunnah_logs && backupData.sunnah_logs.length > 0) {
      // Delete existing sunnah logs
      await supabase
        .from('sunnah_logs')
        .delete()
        .eq('user_id', user.id);

      // Insert backup sunnah logs (exclude nested habit data)
      const { error: sunnahError } = await supabase
        .from('sunnah_logs')
        .insert(backupData.sunnah_logs.map(log => {
          const { sunnah_habits, ...logData } = log;
          return {
            ...logData,
            user_id: user.id,
          };
        }));

      if (sunnahError) throw sunnahError;
    }

    // Restore quran progress
    if (backupData.quran_progress && backupData.quran_progress.length > 0) {
      // Delete existing quran progress
      await supabase
        .from('quran_progress')
        .delete()
        .eq('user_id', user.id);

      // Insert backup quran progress
      const { error: quranError } = await supabase
        .from('quran_progress')
        .insert(backupData.quran_progress.map(progress => ({
          ...progress,
          user_id: user.id,
        })));

      if (quranError) throw quranError;
    }

    // Restore user profile
    if (backupData.user_profile) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          ...backupData.user_profile,
          id: user.id,
        });

      if (profileError) throw profileError;
    }

    // Restore settings
    if (backupData.settings) {
      const { error: settingsError } = await supabase
        .from('user_settings')
        .upsert({
          ...backupData.settings,
          user_id: user.id,
        });

      if (settingsError) throw settingsError;
    }

    logger.info(`Backup restored: ${metadata.backup_name}`);
  } catch (error: any) {
    logger.error('Error restoring backup:', error);
    throw error;
  }
};

/**
 * Delete a backup
 */
export const deleteBackup = async (backupId: string): Promise<void> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get backup metadata
    const { data: metadata, error: metadataError } = await supabase
      .from('backup_metadata')
      .select('*')
      .eq('id', backupId)
      .eq('user_id', user.id)
      .single();

    if (metadataError) {
      throw metadataError;
    }

    if (!metadata) {
      throw new Error('Backup not found');
    }

    // Delete from storage
    const storagePath = `${user.id}/${metadata.backup_name}`;
    const { error: storageError } = await supabase.storage
      .from(BACKUP_BUCKET)
      .remove([storagePath]);

    if (storageError) {
      throw storageError;
    }

    // Delete metadata record
    const { error: deleteError } = await supabase
      .from('backup_metadata')
      .delete()
      .eq('id', backupId);

    if (deleteError) {
      throw deleteError;
    }

    logger.info(`Backup deleted: ${metadata.backup_name}`);
  } catch (error: any) {
    logger.error('Error deleting backup:', error);
    throw error;
  }
};

/**
 * Download backup file for local storage
 */
export const downloadBackupFile = async (backupId: string): Promise<string> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get backup metadata
    const { data: metadata, error: metadataError } = await supabase
      .from('backup_metadata')
      .select('*')
      .eq('id', backupId)
      .eq('user_id', user.id)
      .single();

    if (metadataError) {
      throw metadataError;
    }

    if (!metadata) {
      throw new Error('Backup not found');
    }

    // Download backup file from Supabase Storage
    const storagePath = `${user.id}/${metadata.backup_name}`;
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(BACKUP_BUCKET)
      .download(storagePath);

    if (downloadError) {
      throw downloadError;
    }

    // Save to local file
    // Clean the filename to prevent path issues
    const cleanFilename = metadata.backup_name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileUri = `${(FileSystem as any).documentDirectory}${cleanFilename}`;
    const backupText = await fileData.text();

    // Validate the fileUri before writing
    if (!fileUri || !fileUri.includes('.json')) {
      throw new Error('Invalid backup file path generated');
    }

    await FileSystem.writeAsStringAsync(fileUri, backupText, {
      encoding: (FileSystem as any).EncodingType.UTF8,
    });

    logger.info(`Backup downloaded: ${cleanFilename} to ${fileUri}`);

    return fileUri;
  } catch (error: any) {
    logger.error('Error downloading backup:', error);
    throw error;
  }
};

/**
 * Get backup statistics
 */
export const getBackupStats = async (): Promise<{
  totalBackups: number;
  totalSizeBytes: number;
  latestBackup: BackupMetadata | null;
  oldestBackup: BackupMetadata | null;
}> => {
  try {
    const backups = await listBackups();

    if (backups.length === 0) {
      return {
        totalBackups: 0,
        totalSizeBytes: 0,
        latestBackup: null,
        oldestBackup: null,
      };
    }

    const totalSizeBytes = backups.reduce((sum, backup) => sum + backup.size_bytes, 0);

    return {
      totalBackups: backups.length,
      totalSizeBytes,
      latestBackup: backups[0], // Already sorted by created_at desc
      oldestBackup: backups[backups.length - 1],
    };
  } catch (error: any) {
    logger.error('Error getting backup stats:', error);
    throw error;
  }
};
