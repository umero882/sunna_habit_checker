/**
 * Qur'an API Service
 * Client for Al Quran Cloud API (api.alquran.cloud)
 * Fetches Qur'an data: Surahs, Ayahs, Translations, Audio
 */

import { AlQuranCloudResponse, Surah, Ayah, SurahMeta } from '../types';
import { SURAHS } from '../constants/quran';

import { createLogger } from '../utils/logger';

const logger = createLogger('quranApi');

const BASE_URL = 'https://api.alquran.cloud/v1';

/**
 * API Client for Al Quran Cloud
 */
class QuranApiClient {
  /**
   * Fetch a complete Surah with Arabic text and translation
   */
  async getSurah(
    surahNumber: number,
    edition: string = 'quran-uthmani', // Arabic text
    translation: string = 'en.sahih' // Translation edition
  ): Promise<Surah | null> {
    try {
      // Fetch Arabic text and translation in parallel
      const [arabicResponse, translationResponse] = await Promise.all([
        fetch(`${BASE_URL}/surah/${surahNumber}/${edition}`),
        fetch(`${BASE_URL}/surah/${surahNumber}/${translation}`),
      ]);

      if (!arabicResponse.ok || !translationResponse.ok) {
        logger.error('Failed to fetch surah data');
        return null;
      }

      const arabicData: AlQuranCloudResponse = await arabicResponse.json();
      const translationData: AlQuranCloudResponse = await translationResponse.json();

      // Get metadata from constants
      const metadata = SURAHS.find(s => s.number === surahNumber);
      if (!metadata) {
        logger.error(`Surah ${surahNumber} metadata not found`);
        return null;
      }

      // Combine Arabic and translation
      const ayahs: Ayah[] = arabicData.data.ayahs.map((ayah, index) => ({
        number: ayah.numberInSurah,
        numberInQuran: ayah.number,
        text: ayah.text,
        translation: translationData.data.ayahs[index]?.text,
        page: ayah.page,
        juz: ayah.juz,
        manzil: ayah.manzil,
        ruku: ayah.ruku,
        hizbQuarter: ayah.hizbQuarter,
      }));

      const surah: Surah = {
        ...metadata,
        ayahs,
      };

      return surah;
    } catch (error) {
      logger.error('Error fetching surah:', error);
      return null;
    }
  }

  /**
   * Fetch Surah with transliteration
   */
  async getSurahWithTransliteration(
    surahNumber: number,
    translation: string = 'en.sahih'
  ): Promise<Surah | null> {
    try {
      const [arabicResponse, translationResponse, transliterationResponse] = await Promise.all([
        fetch(`${BASE_URL}/surah/${surahNumber}/quran-uthmani`),
        fetch(`${BASE_URL}/surah/${surahNumber}/${translation}`),
        fetch(`${BASE_URL}/surah/${surahNumber}/en.transliteration`),
      ]);

      if (!arabicResponse.ok || !translationResponse.ok) {
        logger.error('Failed to fetch surah data');
        return null;
      }

      const arabicData: AlQuranCloudResponse = await arabicResponse.json();
      const translationData: AlQuranCloudResponse = await translationResponse.json();
      const transliterationData = transliterationResponse.ok
        ? await transliterationResponse.json()
        : null;

      const metadata = SURAHS.find(s => s.number === surahNumber);
      if (!metadata) return null;

      const ayahs: Ayah[] = arabicData.data.ayahs.map((ayah, index) => ({
        number: ayah.numberInSurah,
        numberInQuran: ayah.number,
        text: ayah.text,
        translation: translationData.data.ayahs[index]?.text,
        transliteration: transliterationData?.data.ayahs[index]?.text,
        page: ayah.page,
        juz: ayah.juz,
        manzil: ayah.manzil,
        ruku: ayah.ruku,
        hizbQuarter: ayah.hizbQuarter,
      }));

      return {
        ...metadata,
        ayahs,
      };
    } catch (error) {
      logger.error('Error fetching surah with transliteration:', error);
      return null;
    }
  }

  /**
   * Fetch a single Ayah
   */
  async getAyah(
    surahNumber: number,
    ayahNumber: number,
    edition: string = 'quran-uthmani'
  ): Promise<Ayah | null> {
    try {
      const response = await fetch(`${BASE_URL}/ayah/${surahNumber}:${ayahNumber}/${edition}`);

      if (!response.ok) {
        logger.error('Failed to fetch ayah');
        return null;
      }

      const data = await response.json();
      const ayah = data.data;

      return {
        number: ayah.numberInSurah,
        numberInQuran: ayah.number,
        text: ayah.text,
        page: ayah.page,
        juz: ayah.juz,
        manzil: ayah.manzil,
        ruku: ayah.ruku,
        hizbQuarter: ayah.hizbQuarter,
      };
    } catch (error) {
      logger.error('Error fetching ayah:', error);
      return null;
    }
  }

  /**
   * Get audio URL for a specific Surah
   * Uses Al-Afasy recitation by default
   */
  getAudioUrl(surahNumber: number, reciter: string = 'ar.alafasy'): string {
    // Format surah number with leading zeros (001, 002, etc.)
    const surahPadded = surahNumber.toString().padStart(3, '0');

    // Al Quran Cloud uses a different URL structure
    // Full Surah audio is available at everyayah.com
    return `https://everyayah.com/data/${reciter}/${surahPadded}.mp3`;
  }

  /**
   * Get audio URL for a specific Ayah
   * Uses verse-by-verse audio segments
   */
  getAyahAudioUrl(surahNumber: number, ayahNumber: number, reciter: string = 'ar.alafasy'): string {
    // Calculate global ayah number (numberInQuran)
    // This requires summing up all ayahs from previous surahs
    let globalAyahNumber = 0;

    // Add ayahs from all previous surahs
    for (let i = 1; i < surahNumber; i++) {
      const surah = SURAHS.find(s => s.number === i);
      if (surah) {
        globalAyahNumber += surah.numberOfAyahs;
      }
    }

    // Add current ayah number
    globalAyahNumber += ayahNumber;

    // Format: https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3 (where 1 is global ayah number)
    return `https://cdn.islamic.network/quran/audio/128/${reciter}/${globalAyahNumber}.mp3`;
  }

  /**
   * Search Quran by keyword
   */
  async searchQuran(keyword: string, language: string = 'en'): Promise<any> {
    try {
      const response = await fetch(
        `${BASE_URL}/search/${encodeURIComponent(keyword)}/${language}.sahih/all`
      );

      if (!response.ok) {
        logger.error('Search failed');
        return null;
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      logger.error('Error searching Quran:', error);
      return null;
    }
  }

  /**
   * Get all available editions (translations)
   */
  async getEditions(): Promise<any[]> {
    try {
      const response = await fetch(`${BASE_URL}/edition`);

      if (!response.ok) {
        logger.error('Failed to fetch editions');
        return [];
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      logger.error('Error fetching editions:', error);
      return [];
    }
  }

  /**
   * Fetch Juz (part) data
   */
  async getJuz(juzNumber: number, edition: string = 'quran-uthmani'): Promise<any> {
    try {
      const response = await fetch(`${BASE_URL}/juz/${juzNumber}/${edition}`);

      if (!response.ok) {
        logger.error('Failed to fetch Juz');
        return null;
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      logger.error('Error fetching Juz:', error);
      return null;
    }
  }

  /**
   * Batch fetch multiple Surahs
   * Useful for preloading/caching
   */
  async getSurahs(
    surahNumbers: number[],
    edition: string = 'quran-uthmani',
    translation: string = 'en.sahih'
  ): Promise<Surah[]> {
    const promises = surahNumbers.map(num => this.getSurah(num, edition, translation));
    const results = await Promise.allSettled(promises);

    return results
      .filter(
        (result): result is PromiseFulfilledResult<Surah> =>
          result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);
  }

  /**
   * Check API health
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${BASE_URL}/surah/1/quran-uthmani`);
      return response.ok;
    } catch (error) {
      logger.error('API health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const quranApi = new QuranApiClient();
export default quranApi;
