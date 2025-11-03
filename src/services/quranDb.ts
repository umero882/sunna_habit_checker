/**
 * Qur'an SQLite Database Service
 * Offline-first storage for Qur'an content
 * Manages local cache of Surahs, Ayahs, and user data
 */

import * as SQLite from 'expo-sqlite';
import { Surah, Ayah, CachedSurah } from '../types';

import { createLogger } from '../utils/logger';

const logger = createLogger('quranDb');

const DB_NAME = 'quran.db';

class QuranDatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  /**
   * Initialize the database
   */
  async init(): Promise<void> {
    try {
      // Skip initialization if already initialized
      if (this.db) {
        logger.debug('Quran database already initialized');
        return;
      }

      this.db = await SQLite.openDatabaseAsync(DB_NAME);

      if (!this.db) {
        throw new Error('Failed to open database - db is null');
      }

      await this.createTables();
      logger.debug('Quran database initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Quran database:', error);
      // Don't throw - allow app to continue without Quran DB
      this.db = null;
    }
  }

  /**
   * Create database tables
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Use runAsync instead of execAsync for DDL statements
      // Cached Surahs table
      await this.db.runAsync(
        'CREATE TABLE IF NOT EXISTS cached_surahs (number INTEGER PRIMARY KEY, metadata TEXT NOT NULL, ayahs TEXT NOT NULL, translation TEXT NOT NULL, cached_at INTEGER NOT NULL)'
      );

      // Bookmarks table (local only, synced to Supabase)
      await this.db.runAsync(
        'CREATE TABLE IF NOT EXISTS local_bookmarks (id TEXT PRIMARY KEY, surah_number INTEGER NOT NULL, ayah_number INTEGER NOT NULL, note TEXT, created_at INTEGER NOT NULL)'
      );

      // Reading progress (last position)
      await this.db.runAsync(
        'CREATE TABLE IF NOT EXISTS reading_progress (id INTEGER PRIMARY KEY CHECK (id = 1), last_surah INTEGER, last_ayah INTEGER, updated_at INTEGER NOT NULL)'
      );

      // Create indexes
      await this.db.runAsync(
        'CREATE INDEX IF NOT EXISTS idx_bookmarks_surah ON local_bookmarks(surah_number, ayah_number)'
      );

      logger.debug('Database tables created successfully');
    } catch (error) {
      logger.error('Error creating tables:', error);
      throw error;
    }
  }

  /**
   * Cache a Surah for offline access
   */
  async cacheSurah(surah: Surah, translation: string): Promise<void> {
    if (!this.db) {
      logger.warn('Database not initialized, skipping Surah cache');
      return;
    }

    try {
      const { number, ayahs, ...metadata } = surah;

      await this.db.runAsync(
        `INSERT OR REPLACE INTO cached_surahs
         (number, metadata, ayahs, translation, cached_at)
         VALUES (?, ?, ?, ?, ?)`,
        [number, JSON.stringify(metadata), JSON.stringify(ayahs), translation, Date.now()]
      );

      logger.debug(`Surah ${number} cached successfully`);
    } catch (error) {
      logger.error(`Failed to cache Surah ${surah.number}:`, error);
      // Don't throw - this is a non-critical operation
    }
  }

  /**
   * Get cached Surah
   */
  async getCachedSurah(surahNumber: number, translation: string): Promise<Surah | null> {
    if (!this.db) {
      logger.warn('Database not initialized, cannot get cached Surah');
      return null;
    }

    try {
      const result = await this.db.getFirstAsync<CachedSurah>(
        `SELECT * FROM cached_surahs
         WHERE number = ? AND translation = ?`,
        [surahNumber, translation]
      );

      if (!result) {
        return null;
      }

      const metadata = JSON.parse(result.metadata);
      const ayahs = JSON.parse(result.ayahs);

      return {
        number: result.number,
        ...metadata,
        ayahs,
      };
    } catch (error) {
      logger.error(`Failed to get cached Surah ${surahNumber}:`, error);
      return null;
    }
  }

  /**
   * Check if Surah is cached
   */
  async isSurahCached(surahNumber: number, translation: string): Promise<boolean> {
    if (!this.db) {
      logger.warn('Database not initialized, cannot check cache');
      return false;
    }

    try {
      const result = await this.db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM cached_surahs
         WHERE number = ? AND translation = ?`,
        [surahNumber, translation]
      );

      return (result?.count ?? 0) > 0;
    } catch (error) {
      logger.error('Failed to check cache:', error);
      return false;
    }
  }

  /**
   * Get all cached Surah numbers
   */
  async getCachedSurahNumbers(): Promise<number[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const results = await this.db.getAllAsync<{ number: number }>(
        `SELECT number FROM cached_surahs ORDER BY number`
      );

      return results.map(r => r.number);
    } catch (error) {
      logger.error('Failed to get cached surah numbers:', error);
      return [];
    }
  }

  /**
   * Clear old cache (older than X days)
   */
  async clearOldCache(daysOld: number = 30): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;

    try {
      await this.db.runAsync(`DELETE FROM cached_surahs WHERE cached_at < ?`, [cutoffTime]);

      logger.debug(`Cleared cache older than ${daysOld} days`);
    } catch (error) {
      logger.error('Failed to clear old cache:', error);
    }
  }

  /**
   * Get cache size
   */
  async getCacheSize(): Promise<{ surahCount: number; totalSizeBytes: number }> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const countResult = await this.db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM cached_surahs`
      );

      // Estimate size (rough calculation)
      const sizeResult = await this.db.getFirstAsync<{ total_size: number }>(
        `SELECT SUM(LENGTH(metadata) + LENGTH(ayahs)) as total_size
         FROM cached_surahs`
      );

      return {
        surahCount: countResult?.count ?? 0,
        totalSizeBytes: sizeResult?.total_size ?? 0,
      };
    } catch (error) {
      logger.error('Failed to get cache size:', error);
      return { surahCount: 0, totalSizeBytes: 0 };
    }
  }

  /**
   * Add bookmark
   */
  async addBookmark(
    id: string,
    surahNumber: number,
    ayahNumber: number,
    note?: string
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO local_bookmarks
         (id, surah_number, ayah_number, note, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [id, surahNumber, ayahNumber, note ?? null, Date.now()]
      );

      logger.debug(`Bookmark added: ${surahNumber}:${ayahNumber}`);
    } catch (error) {
      logger.error('Failed to add bookmark:', error);
      throw error;
    }
  }

  /**
   * Remove bookmark
   */
  async removeBookmark(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(`DELETE FROM local_bookmarks WHERE id = ?`, [id]);

      logger.debug(`Bookmark removed: ${id}`);
    } catch (error) {
      logger.error('Failed to remove bookmark:', error);
      throw error;
    }
  }

  /**
   * Get all bookmarks
   */
  async getBookmarks(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const results = await this.db.getAllAsync(
        `SELECT * FROM local_bookmarks ORDER BY created_at DESC`
      );

      return results;
    } catch (error) {
      logger.error('Failed to get bookmarks:', error);
      return [];
    }
  }

  /**
   * Save reading progress (last position)
   */
  async saveReadingProgress(surahNumber: number, ayahNumber: number): Promise<void> {
    if (!this.db) {
      logger.warn('Database not initialized, skipping progress save');
      return;
    }

    try {
      const result = await this.db.runAsync(
        `INSERT OR REPLACE INTO reading_progress
         (id, last_surah, last_ayah, updated_at)
         VALUES (1, ?, ?, ?)`,
        [surahNumber, ayahNumber, Date.now()]
      );

      logger.debug(
        `✅ Reading progress saved successfully: Surah ${surahNumber}, Ayah ${ayahNumber}`
      );

      // Verify the save
      const verification = await this.db.getFirstAsync<{
        last_surah: number;
        last_ayah: number;
      }>(`SELECT last_surah, last_ayah FROM reading_progress WHERE id = 1`);

      if (verification) {
        logger.debug(
          `✓ Verified in DB: Surah ${verification.last_surah}, Ayah ${verification.last_ayah}`
        );
      }
    } catch (error) {
      logger.error('❌ Failed to save reading progress:', error);
      // Don't throw - this is a non-critical operation
    }
  }

  /**
   * Get reading progress
   */
  async getReadingProgress(): Promise<{ lastSurah: number; lastAyah: number } | null> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getFirstAsync<{
        last_surah: number;
        last_ayah: number;
      }>(`SELECT last_surah, last_ayah FROM reading_progress WHERE id = 1`);

      if (!result) {
        return null;
      }

      return {
        lastSurah: result.last_surah,
        lastAyah: result.last_ayah,
      };
    } catch (error) {
      logger.error('Failed to get reading progress:', error);
      return null;
    }
  }

  /**
   * Clear all cached data
   */
  async clearAllCache(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync('DELETE FROM cached_surahs');
      logger.debug('All cache cleared');
    } catch (error) {
      logger.error('Failed to clear cache:', error);
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      logger.debug('Database closed');
    }
  }

  /**
   * Batch cache multiple Surahs
   */
  async cacheSurahs(surahs: Surah[], translation: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Use transaction for better performance
      await this.db.withTransactionAsync(async () => {
        for (const surah of surahs) {
          await this.cacheSurah(surah, translation);
        }
      });

      logger.debug(`${surahs.length} surahs cached successfully`);
    } catch (error) {
      logger.error('Failed to batch cache surahs:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    cachedSurahs: number;
    bookmarks: number;
    cacheSize: number;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const [surahsResult, bookmarksResult, sizeInfo] = await Promise.all([
        this.db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM cached_surahs`),
        this.db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM local_bookmarks`),
        this.getCacheSize(),
      ]);

      return {
        cachedSurahs: surahsResult?.count ?? 0,
        bookmarks: bookmarksResult?.count ?? 0,
        cacheSize: sizeInfo.totalSizeBytes,
      };
    } catch (error) {
      logger.error('Failed to get database stats:', error);
      return { cachedSurahs: 0, bookmarks: 0, cacheSize: 0 };
    }
  }
}

// Export singleton instance
export const quranDb = new QuranDatabaseService();
export default quranDb;
