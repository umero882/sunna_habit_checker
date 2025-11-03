/**
 * Word Timing Service - SQLite Version
 * Manages retrieval of word-level timing data from SQLite database
 * for Quran recitation synchronization
 */

import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import {
  ReciterTimingData,
  AyahTiming,
  WordSegment,
} from '../types/wordTiming';

import { createLogger } from '../utils/logger';

const logger = createLogger('wordTimingService');


const DB_NAME = 'quran-timing.db';

class WordTimingService {
  private db: SQLite.SQLiteDatabase | null = null;
  private cache: Map<string, Map<string, AyahTiming>> = new Map(); // reciter -> ayahKey -> timing
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the database
   */
  private async initializeDatabase(): Promise<void> {
    if (this.db) return;

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        logger.debug('📦 Initializing word timing database...');

        const dbPath = `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;
        const dbDir = `${FileSystem.documentDirectory}SQLite`;

        // Ensure SQLite directory exists
        const dirInfo = await FileSystem.getInfoAsync(dbDir);
        if (!dirInfo.exists) {
          logger.debug('📁 Creating SQLite directory...');
          await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
        }

        // Check if database exists
        const dbInfo = await FileSystem.getInfoAsync(dbPath);

        if (!dbInfo.exists) {
          logger.debug('📥 Copying word timing database from assets...');

          // Copy database from assets to SQLite directory
          const Asset = require('expo-asset').Asset;
          const asset = Asset.fromModule(require('../../assets/quran-timing.db'));

          await asset.downloadAsync();

          if (asset.localUri) {
            await FileSystem.copyAsync({
              from: asset.localUri,
              to: dbPath
            });
            logger.debug('✅ Database copied successfully');
          } else {
            throw new Error('Failed to download asset');
          }
        }

        this.db = await SQLite.openDatabaseAsync(DB_NAME);
        logger.debug('✅ Word timing database initialized and ready');
      } catch (error) {
        logger.error('❌ Failed to initialize word timing database:', error);
        logger.warn('ℹ️ Word-level highlighting will be disabled, using ayah-level fallback');
        this.db = null;
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  /**
   * Check if timing data is available for a reciter
   */
  isTimingAvailable(reciter: string): boolean {
    // List of reciters with timing data in the database
    const availableReciters = [
      'ar.alafasy',
      'ar.husary',
      'ar.husarymujawwad',
    ];
    return availableReciters.includes(reciter);
  }

  /**
   * Get the list of reciters with timing data available
   */
  getAvailableReciters(): string[] {
    return [
      'ar.alafasy',
      'ar.husary',
      'ar.husarymujawwad',
    ];
  }

  /**
   * Get timing data for a specific ayah
   */
  async getAyahTiming(
    reciter: string,
    surahNumber: number,
    ayahNumber: number
  ): Promise<AyahTiming | null> {
    try {
      await this.initializeDatabase();

      if (!this.db) {
        logger.error('❌ Database not initialized');
        return null;
      }

      if (!this.isTimingAvailable(reciter)) {
        logger.warn(`⚠️ No timing data available for reciter: ${reciter}`);
        return null;
      }

      // Check cache first
      const ayahKey = `${surahNumber}:${ayahNumber}`;
      const reciterCache = this.cache.get(reciter);
      if (reciterCache?.has(ayahKey)) {
        return reciterCache.get(ayahKey)!;
      }

      // Query database
      const rows = await this.db.getAllAsync<{
        word_start_index: number;
        word_end_index: number;
        start_ms: number;
        end_ms: number;
      }>(
        `SELECT word_start_index, word_end_index, start_ms, end_ms
         FROM timing_segments
         WHERE reciter = ? AND surah = ? AND ayah = ?
         ORDER BY word_start_index`,
        [reciter, surahNumber, ayahNumber]
      );

      if (rows.length === 0) {
        logger.warn(`⚠️ No timing data found for ${reciter} - ${surahNumber}:${ayahNumber}`);
        return null;
      }

      // Convert to AyahTiming format
      const ayahTiming: AyahTiming = {
        surah: surahNumber,
        ayah: ayahNumber,
        segments: rows.map(row => ({
          wordStartIndex: row.word_start_index,
          wordEndIndex: row.word_end_index,
          startMs: row.start_ms,
          endMs: row.end_ms,
        })),
      };

      // Cache the result
      if (!this.cache.has(reciter)) {
        this.cache.set(reciter, new Map());
      }
      this.cache.get(reciter)!.set(ayahKey, ayahTiming);

      return ayahTiming;
    } catch (error) {
      logger.error(`❌ Error getting ayah timing:`, error);
      return null;
    }
  }

  /**
   * Find the current word index based on audio position
   */
  getCurrentWordIndex(
    segments: WordSegment[],
    positionMs: number
  ): number {
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      if (positionMs >= segment.startMs && positionMs < segment.endMs) {
        return segment.wordStartIndex;
      }
    }

    // If position is beyond all segments, return last word index
    if (segments.length > 0 && positionMs >= segments[segments.length - 1].endMs) {
      return segments[segments.length - 1].wordStartIndex;
    }

    return -1; // No word active
  }

  /**
   * Load timing data (kept for compatibility, now does nothing)
   */
  async loadTimingData(reciter: string): Promise<ReciterTimingData | null> {
    logger.debug(`ℹ️ SQLite version - timing data loaded on-demand per ayah`);
    return null;
  }

  /**
   * Clear cache
   */
  clearCache(reciter?: string): void {
    if (reciter) {
      this.cache.delete(reciter);
      logger.debug(`🗑️ Cleared cache for ${reciter}`);
    } else {
      this.cache.clear();
      logger.debug(`🗑️ Cleared all cache`);
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      logger.debug('🔒 Database closed');
    }
  }
}

// Export singleton instance
export const wordTimingService = new WordTimingService();
export default wordTimingService;
