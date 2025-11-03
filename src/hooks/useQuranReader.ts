/**
 * useQuranReader Hook
 * Manages Qur'an reading state, fetching, and caching
 */

import { useState, useEffect, useCallback } from 'react';
import { Surah, Ayah } from '../types';
import { quranApi } from '../services/quranApi';
import { quranDb } from '../services/quranDb';

import { createLogger } from '../utils/logger';

const logger = createLogger('useQuranReader');

interface UseQuranReaderOptions {
  surahNumber: number;
  translation?: string;
  includeTransliteration?: boolean;
  autoCache?: boolean;
}

interface UseQuranReaderReturn {
  surah: Surah | null;
  isLoading: boolean;
  error: Error | null;
  isCached: boolean;
  refetch: () => Promise<void>;
  goToAyah: (ayahNumber: number) => void;
  currentAyah: number;
  saveProgress: () => Promise<void>;
}

export const useQuranReader = ({
  surahNumber,
  translation = 'en.sahih',
  includeTransliteration = false,
  autoCache = true,
}: UseQuranReaderOptions): UseQuranReaderReturn => {
  const [surah, setSurah] = useState<Surah | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [currentAyah, setCurrentAyah] = useState(1);

  /**
   * Fetch Surah data (offline-first)
   */
  const fetchSurah = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Try to get from cache first
      const cached = await quranDb.getCachedSurah(surahNumber, translation);

      if (cached) {
        setSurah(cached);
        setIsCached(true);
        setIsLoading(false);
        return;
      }

      // Fetch from API
      let fetchedSurah: Surah | null;

      if (includeTransliteration) {
        fetchedSurah = await quranApi.getSurahWithTransliteration(surahNumber, translation);
      } else {
        fetchedSurah = await quranApi.getSurah(surahNumber, 'quran-uthmani', translation);
      }

      if (!fetchedSurah) {
        throw new Error(`Failed to fetch Surah ${surahNumber}`);
      }

      setSurah(fetchedSurah);
      setIsCached(false);

      // Cache for offline use if enabled
      if (autoCache) {
        await quranDb.cacheSurah(fetchedSurah, translation);
        setIsCached(true);
      }
    } catch (err) {
      logger.error('Error fetching surah:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [surahNumber, translation, includeTransliteration, autoCache]);

  /**
   * Refetch surah data
   */
  const refetch = useCallback(async () => {
    await fetchSurah();
  }, [fetchSurah]);

  /**
   * Navigate to specific ayah
   */
  const goToAyah = useCallback(
    (ayahNumber: number) => {
      logger.debug(`🔄 goToAyah called: ayahNumber=${ayahNumber}, currentAyah=${currentAyah}`);
      setCurrentAyah(ayahNumber);
    },
    [currentAyah]
  );

  /**
   * Save reading progress
   */
  const saveProgress = useCallback(async () => {
    try {
      await quranDb.saveReadingProgress(surahNumber, currentAyah);
      logger.debug(`📝 Progress saved from hook: Surah ${surahNumber}, Ayah ${currentAyah}`);
    } catch (err) {
      logger.error('❌ Failed to save progress in hook:', err);
    }
  }, [surahNumber, currentAyah]);

  /**
   * Load surah on mount or when surahNumber changes
   */
  useEffect(() => {
    fetchSurah();
  }, [fetchSurah]);

  /**
   * Auto-save progress when changing ayah
   */
  useEffect(() => {
    if (currentAyah >= 1 && surah) {
      saveProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAyah, surah]);

  return {
    surah,
    isLoading,
    error,
    isCached,
    refetch,
    goToAyah,
    currentAyah,
    saveProgress,
  };
};

export default useQuranReader;
