/**
 * Export Service
 * Handles exporting user data to CSV format for backup and analysis
 */

import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { supabase, getCurrentUser } from './supabase';
import { format } from 'date-fns';
import { createLogger } from '../utils/logger';
import type { PrayerLog, SunnahLog } from '../types';

const logger = createLogger('exportService');

/**
 * Convert data to CSV format
 */
const convertToCSV = (data: any[], headers: string[]): string => {
  // Create header row
  const headerRow = headers.join(',');

  // Create data rows
  const dataRows = data.map(row => {
    return headers
      .map(header => {
        const value = row[header];

        // Handle null/undefined
        if (value === null || value === undefined) {
          return '';
        }

        // Handle arrays (convert to JSON string)
        if (Array.isArray(value)) {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }

        // Handle objects (convert to JSON string)
        if (typeof value === 'object') {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }

        // Handle strings with commas or quotes
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }

        return stringValue;
      })
      .join(',');
  });

  return [headerRow, ...dataRows].join('\n');
};

/**
 * Export prayer logs to CSV
 */
export const exportPrayerLogs = async (startDate?: string, endDate?: string): Promise<string> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    logger.info(
      `📊 Fetching prayer logs for user ${user.id}${startDate ? ` from ${startDate} to ${endDate}` : ' (all time)'}`
    );

    // Build query
    let query = supabase
      .from('prayer_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('logged_at', { ascending: false });

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('❌ Supabase error fetching prayer logs:', error);
      throw error;
    }

    logger.info(`📝 Found ${data?.length || 0} prayer logs`);

    if (!data || data.length === 0) {
      throw new Error('No prayer logs found for the selected date range');
    }

    // Define CSV headers
    const headers = [
      'date',
      'prayer',
      'status',
      'jamaah',
      'note',
      'friday_sunnah_completed',
      'logged_at',
      'created_at',
      'updated_at',
    ];

    // Convert to CSV
    const csv = convertToCSV(data, headers);

    // Create filename
    const filename = `prayer_logs_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.csv`;

    // Save to file using new API
    const file = new File(Paths.document, filename);
    await file.write(csv);

    logger.info(`Prayer logs exported to ${file.uri}`);

    return file.uri;
  } catch (error: any) {
    logger.error('Error exporting prayer logs:', error);
    throw error;
  }
};

/**
 * Export Sunnah habit logs to CSV
 */
export const exportSunnahLogs = async (startDate?: string, endDate?: string): Promise<string> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    logger.info(
      `📊 Fetching Sunnah logs for user ${user.id}${startDate ? ` from ${startDate} to ${endDate}` : ' (all time)'}`
    );

    // Build query - join with habits to get habit names
    let query = supabase
      .from('sunnah_logs')
      .select(
        `
        *,
        sunnah_habits (
          name
        )
      `
      )
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('logged_at', { ascending: false });

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('❌ Supabase error fetching Sunnah logs:', error);
      throw error;
    }

    logger.info(`📝 Found ${data?.length || 0} Sunnah logs`);

    if (!data || data.length === 0) {
      throw new Error('No Sunnah logs found for the selected date range');
    }

    // Flatten data for CSV
    const flatData = data.map((log: any) => ({
      date: log.date,
      habit_id: log.habit_id,
      habit_name: log.sunnah_habits?.name || 'Unknown',
      completed: log.completed,
      level: log.level,
      note: log.note,
      logged_at: log.logged_at,
      created_at: log.created_at,
      updated_at: log.updated_at,
    }));

    // Define CSV headers
    const headers = [
      'date',
      'habit_id',
      'habit_name',
      'completed',
      'level',
      'note',
      'logged_at',
      'created_at',
      'updated_at',
    ];

    // Convert to CSV
    const csv = convertToCSV(flatData, headers);

    // Create filename
    const filename = `sunnah_logs_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.csv`;

    // Save to file using new API
    const file = new File(Paths.document, filename);
    await file.write(csv);

    logger.info(`Sunnah logs exported to ${file.uri}`);

    return file.uri;
  } catch (error: any) {
    logger.error('Error exporting Sunnah logs:', error);
    throw error;
  }
};

/**
 * Export Quran progress to CSV
 */
export const exportQuranProgress = async (): Promise<string> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    logger.info(`📊 Fetching Quran reading logs for user ${user.id}`);

    // Get Quran reading logs (the actual table used in the app)
    const { data, error } = await supabase
      .from('quran_reading_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      logger.error('❌ Supabase error fetching Quran reading logs:', error);
      throw error;
    }

    logger.info(`📝 Found ${data?.length || 0} Quran reading logs`);

    if (!data || data.length === 0) {
      throw new Error('No Quran reading logs found');
    }

    // Define CSV headers for quran_reading_logs
    const headers = [
      'date',
      'surah_number',
      'from_ayah',
      'to_ayah',
      'pages_read',
      'duration_minutes',
      'reflection',
      'created_at',
    ];

    // Convert to CSV
    const csv = convertToCSV(data, headers);

    // Create filename
    const filename = `quran_reading_logs_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.csv`;

    // Save to file using new API
    const file = new File(Paths.document, filename);
    await file.write(csv);

    logger.info(`Quran progress exported to ${file.uri}`);

    return file.uri;
  } catch (error: any) {
    logger.error('Error exporting Quran progress:', error);
    throw error;
  }
};

/**
 * Export all data (prayers, Sunnah, Quran) to separate CSV files and share as ZIP
 */
export const exportAllData = async (startDate?: string, endDate?: string): Promise<string[]> => {
  try {
    const fileUris: string[] = [];
    const errors: string[] = [];

    // Export prayer logs
    try {
      const prayerUri = await exportPrayerLogs(startDate, endDate);
      fileUris.push(prayerUri);
      logger.info('✅ Prayer logs exported successfully');
    } catch (error: any) {
      logger.warn('⚠️ Could not export prayer logs:', error.message);
      errors.push(`Prayer logs: ${error.message}`);
    }

    // Export Sunnah logs
    try {
      const sunnahUri = await exportSunnahLogs(startDate, endDate);
      fileUris.push(sunnahUri);
      logger.info('✅ Sunnah logs exported successfully');
    } catch (error: any) {
      logger.warn('⚠️ Could not export Sunnah logs:', error.message);
      errors.push(`Sunnah logs: ${error.message}`);
    }

    // Export Quran progress (no date filter - always export all)
    try {
      const quranUri = await exportQuranProgress();
      fileUris.push(quranUri);
      logger.info('✅ Quran progress exported successfully');
    } catch (error: any) {
      logger.warn('⚠️ Could not export Quran progress:', error.message);
      errors.push(`Quran progress: ${error.message}`);
    }

    if (fileUris.length === 0) {
      // Provide detailed error message
      const dateRangeText =
        startDate && endDate ? `between ${startDate} and ${endDate}` : 'in your account';

      const errorDetails = errors.length > 0 ? `\n\nDetails:\n${errors.join('\n')}` : '';

      throw new Error(
        `No data available to export ${dateRangeText}. ` +
          `Try selecting a different date range or add some data first.${errorDetails}`
      );
    }

    logger.info(`📦 Successfully exported ${fileUris.length} file(s)`);
    return fileUris;
  } catch (error: any) {
    logger.error('Error exporting all data:', error);
    throw error;
  }
};

/**
 * Share exported file(s) using native share dialog
 */
export const shareFile = async (fileUri: string): Promise<void> => {
  try {
    // Validate file URI
    if (!fileUri || typeof fileUri !== 'string') {
      throw new Error('Invalid file URI provided');
    }

    // Check if file exists (new API doesn't have exists(), use try-catch on read)
    const file = new File(fileUri);
    try {
      // Try to access the file to verify it exists
      await file.size;
    } catch (error) {
      throw new Error('File does not exist at the specified location');
    }

    logger.info(`Attempting to share file: ${fileUri}`);

    const canShare = await Sharing.isAvailableAsync();

    if (!canShare) {
      throw new Error(
        'Sharing is not available on this device. The file has been saved locally at: ' + fileUri
      );
    }

    // Determine mime type based on file extension
    const fileExtension = fileUri.split('.').pop()?.toLowerCase();
    let mimeType = 'text/csv';
    let uti = 'public.comma-separated-values-text';

    if (fileExtension === 'json') {
      mimeType = 'application/json';
      uti = 'public.json';
    } else if (fileExtension === 'pdf') {
      mimeType = 'application/pdf';
      uti = 'com.adobe.pdf';
    }

    await Sharing.shareAsync(fileUri, {
      mimeType,
      dialogTitle: 'Export Data',
      UTI: uti,
    });

    logger.info(`File shared successfully: ${fileUri}`);
  } catch (error: any) {
    logger.error('Error sharing file:', error);
    throw new Error(`Failed to share file: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Share multiple files
 */
export const shareMultipleFiles = async (fileUris: string[]): Promise<void> => {
  try {
    const canShare = await Sharing.isAvailableAsync();

    if (!canShare) {
      throw new Error('Sharing is not available on this device');
    }

    // Share files one by one (React Native doesn't support sharing multiple files at once)
    for (const fileUri of fileUris) {
      await shareFile(fileUri);
    }

    logger.info(`${fileUris.length} files shared`);
  } catch (error: any) {
    logger.error('Error sharing multiple files:', error);
    throw error;
  }
};

/**
 * Delete exported file
 */
export const deleteFile = async (fileUri: string): Promise<void> => {
  try {
    const file = new File(fileUri);

    // Try to delete, will fail silently if file doesn't exist
    try {
      await file.delete();
      logger.info(`File deleted: ${fileUri}`);
    } catch (error) {
      // File might not exist, ignore error
      logger.warn(`File may not exist: ${fileUri}`);
    }
  } catch (error: any) {
    logger.error('Error deleting file:', error);
    throw error;
  }
};

/**
 * Get export statistics
 */
export const getExportStats = async (): Promise<{
  prayerLogsCount: number;
  sunnahLogsCount: number;
  quranProgressCount: number;
  totalRecords: number;
}> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Count prayer logs
    const { count: prayerCount } = await supabase
      .from('prayer_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Count Sunnah logs
    const { count: sunnahCount } = await supabase
      .from('sunnah_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Count Quran progress
    const { count: quranCount } = await supabase
      .from('quran_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const prayerLogsCount = prayerCount || 0;
    const sunnahLogsCount = sunnahCount || 0;
    const quranProgressCount = quranCount || 0;

    return {
      prayerLogsCount,
      sunnahLogsCount,
      quranProgressCount,
      totalRecords: prayerLogsCount + sunnahLogsCount + quranProgressCount,
    };
  } catch (error: any) {
    logger.error('Error getting export stats:', error);
    throw error;
  }
};
