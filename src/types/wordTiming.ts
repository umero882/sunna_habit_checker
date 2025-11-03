/**
 * Word Timing Types
 * For word-by-word Quran highlighting synchronized with audio recitation
 */

/**
 * Word segment with timing information
 * Format from quran-align: [wordStartIdx, wordEndIdx, startMs, endMs]
 */
export interface WordSegment {
  wordStartIndex: number; // Starting word index (inclusive)
  wordEndIndex: number; // Ending word index (exclusive)
  startMs: number; // Start time in milliseconds
  endMs: number; // End time in milliseconds
}

/**
 * Timing data for a single ayah
 */
export interface AyahTiming {
  surah: number;
  ayah: number;
  segments: WordSegment[];
}

/**
 * Complete timing data for a reciter
 */
export interface ReciterTimingData {
  reciter: string;
  version: string;
  ayahs: AyahTiming[];
}

/**
 * Cached timing data metadata
 */
export interface TimingDataCache {
  reciter: string;
  version: string;
  downloadedAt: number;
  data: ReciterTimingData;
}

/**
 * Download progress callback
 */
export type TimingDownloadProgress = (progress: number) => void;

/**
 * Raw segment format from quran-align JSON
 * [wordStartIdx, wordEndIdx, startMs, endMs]
 */
export type RawWordSegment = [number, number, number, number];

/**
 * Raw ayah timing from quran-align JSON
 */
export interface RawAyahTiming {
  surah: number;
  ayah: number;
  segments: RawWordSegment[];
}
