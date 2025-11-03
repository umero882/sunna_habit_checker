/**
 * Word Timing Service - Simplified Version
 * Downloads SQLite database on first use and queries it
 */

import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import {
  ReciterTimingData,
  AyahTiming,
  WordSegment,
} from '../types/wordTiming';

import { createLogger } from '../utils/logger';

const logger = createLogger('wordTimingServiceSimple');


const DB_NAME = 'quran-timing.db';
// Host the database file somewhere accessible (GitHub releases, your server, etc.)
const DB_DOWNLOAD_URL = 'https://github.com/YOUR_USERNAME/YOUR_REPO/releases/download/v1.0.0/quran-timing.db';

class WordTimingService {
  private db: SQLite.SQLiteDatabase | null = null;
  private cache: Map<string, Map<string, AyahTiming>> = new Map();
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the database (download if needed)
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

        // Create directory
        const dirInfo = await FileSystem.getInfoAsync(dbDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
        }

        // Check if database exists
        const dbInfo = await FileSystem.getInfoAsync(dbPath);

        if (!dbInfo.exists) {
          logger.debug('📥 Downloading timing database (1.3 MB)...');
          logger.debug('⚠️ This is a one-time download');

          // For now, since we don't have a hosted version, we'll skip download
          // and just warn the user
          logger.warn('⚠️ Database download URL not configured');
          logger.warn('ℹ️ Word highlighting will not be available');
          logger.warn('ℹ️ Falling back to ayah-level highlighting');

          // Return early - don't try to open non-existent database
          this.db = null;
          return;

          /* Uncomment when you have a hosted database URL
          await FileSystem.downloadAsync(DB_DOWNLOAD_URL, dbPath);
          logger.debug('✅ Database downloaded successfully');
          */
        }

        // Open the database
        this.db = await SQLite.openDatabaseAsync(DB_NAME);
        logger.debug('✅ Word timing database initialized');
      } catch (error) {
        logger.error('❌ Failed to initialize database:', error);
        this.db = null;
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  /**
   * Check if timing data is available
   */
  isTimingAvailable(reciter: string): boolean {
    const availableReciters = [
      'ar.alafasy',
      'ar.husary',
      'ar.husarymujawwad',
      'ar.minshawi',
      'ar.abdulbasitmurattal',
      'ar.abdulbasitmujawwad',
      'ar.shaatree',
      'ar.hanirifai',
      'ar.saoodshuraym',
      'ar.muhammadjibreel',
      'ar.tablaway',
    ];
    return availableReciters.includes(reciter) && this.db !== null;
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
        return null;
      }

      // Check cache
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
        return null;
      }

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

      // Cache
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
   * Get current word index from position
   */
  getCurrentWordIndex(segments: WordSegment[], positionMs: number): number {
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      if (positionMs >= segment.startMs && positionMs < segment.endMs) {
        return segment.wordStartIndex;
      }
    }

    if (segments.length > 0 && positionMs >= segments[segments.length - 1].endMs) {
      return segments[segments.length - 1].wordStartIndex;
    }

    return -1;
  }

  /**
   * Compatibility method
   */
  async loadTimingData(reciter: string): Promise<ReciterTimingData | null> {
    return null;
  }

  getAvailableReciters(): string[] {
    return [
      'ar.alafasy',
      'ar.husary',
      'ar.husarymujawwad',
      'ar.minshawi',
      'ar.abdulbasitmurattal',
      'ar.abdulbasitmujawwad',
      'ar.shaatree',
      'ar.hanirifai',
      'ar.saoodshuraym',
      'ar.muhammadjibreel',
      'ar.tablaway',
    ];
  }

  clearCache(reciter?: string): void {
    if (reciter) {
      this.cache.delete(reciter);
    } else {
      this.cache.clear();
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}

export const wordTimingService = new WordTimingService();
export default wordTimingService;
