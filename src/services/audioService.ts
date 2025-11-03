/**
 * Qur'an Audio Service
 * Manages audio playback with verse-by-verse highlighting
 * Supports background audio, speed control, and offline caching
 *
 * Migrated to expo-audio (from deprecated expo-av)
 */

import { AudioPlayer, setAudioModeAsync, createAudioPlayer } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { AudioState } from '../types';
import { quranApi } from './quranApi';

import { createLogger } from '../utils/logger';

const logger = createLogger('audioService');

/**
 * Audio Status Interface (replacing AVPlaybackStatus from expo-av)
 */
export interface AudioStatus {
  isLoaded: boolean;
  isPlaying: boolean;
  isBuffering: boolean;
  positionMillis: number;
  durationMillis: number;
  didJustFinish: boolean;
  playbackRate: number;
}

export interface AudioPlayerCallbacks {
  onPlaybackStatusUpdate?: (status: AudioStatus) => void;
  onAyahChange?: (ayahNumber: number) => void;
  onWordChange?: (wordIndex: number, positionMs: number) => void; // NEW: Word-level synchronization
  onPlaybackEnd?: () => void;
  onError?: (error: Error) => void;
}

class QuranAudioService {
  private player: AudioPlayer | null = null;
  private currentSurah: number | null = null;
  private currentAyah: number | null = null;
  private currentReciter: string = 'ar.alafasy';
  private playbackSpeed: number = 1.0;
  private isInitialized: boolean = false;
  private callbacksList: AudioPlayerCallbacks[] = []; // Support multiple subscribers
  private isSequentialMode: boolean = true; // Ayah-by-ayah mode
  private totalAyahsInSurah: number = 0;
  private hasLoggedDownloadMessage: boolean = false; // Track if we've shown the download message
  private statusUpdateInterval: NodeJS.Timeout | null = null; // For polling playback status

  /**
   * Initialize audio service
   */
  async initialize(): Promise<void> {
    try {
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'duckOthers' as any,
        interruptionModeAndroid: 'duckOthers' as any,
        shouldRouteThroughEarpiece: false,
      });

      this.isInitialized = true;
      logger.debug('Audio service initialized with expo-audio');
    } catch (error) {
      logger.error('Failed to initialize audio service:', error);
      throw error;
    }
  }

  /**
   * Add callbacks for playback events (supports multiple subscribers)
   */
  setCallbacks(callbacks: AudioPlayerCallbacks): () => void {
    this.callbacksList.push(callbacks);
    logger.debug(
      `📝 audioService: Added callbacks (total subscribers: ${this.callbacksList.length})`
    );

    // Return unsubscribe function
    return () => {
      const index = this.callbacksList.indexOf(callbacks);
      if (index > -1) {
        this.callbacksList.splice(index, 1);
        logger.debug(
          `📝 audioService: Removed callbacks (total subscribers: ${this.callbacksList.length})`
        );
      }
    };
  }

  /**
   * Get total ayahs in a Surah
   */
  private getTotalAyahs(surahNumber: number): number {
    const { SURAHS } = require('../constants/quran');
    const surah = SURAHS.find((s: any) => s.number === surahNumber);
    return surah?.numberOfAyahs || 0;
  }

  /**
   * Start status polling for the player
   */
  private startStatusPolling(): void {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
    }

    this.statusUpdateInterval = setInterval(() => {
      if (this.player) {
        const status = this.getPlayerStatus();

        // Notify all subscribers
        this.callbacksList.forEach(callbacks => {
          callbacks.onPlaybackStatusUpdate?.(status);
        });

        // Emit word position for synchronization
        if (status.isPlaying) {
          const positionMs = status.positionMillis;
          this.callbacksList.forEach(callbacks => {
            callbacks.onWordChange?.(-1, positionMs); // -1 = let subscriber calculate index
          });
        }

        // Check if playback finished
        if (status.didJustFinish) {
          this.handlePlaybackFinish();
        }
      }
    }, 100); // Poll every 100ms for smooth updates
  }

  /**
   * Stop status polling
   */
  private stopStatusPolling(): void {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
      this.statusUpdateInterval = null;
    }
  }

  /**
   * Get current player status
   */
  private getPlayerStatus(): AudioStatus {
    if (!this.player) {
      return {
        isLoaded: false,
        isPlaying: false,
        isBuffering: false,
        positionMillis: 0,
        durationMillis: 0,
        didJustFinish: false,
        playbackRate: 1.0,
      };
    }

    const positionMillis = (this.player.currentTime || 0) * 1000;
    const durationMillis = (this.player.duration || 0) * 1000;
    const didJustFinish =
      this.player.isLoaded && !this.player.playing && positionMillis >= durationMillis - 100;

    return {
      isLoaded: this.player.isLoaded,
      isPlaying: this.player.playing,
      isBuffering: this.player.isBuffering,
      positionMillis,
      durationMillis,
      didJustFinish,
      playbackRate: this.player.playbackRate || 1.0,
    };
  }

  /**
   * Handle playback finish
   */
  private handlePlaybackFinish(): void {
    // Ayah just finished, play next one if in sequential mode
    if (this.isSequentialMode && this.currentSurah && this.currentAyah) {
      const nextAyah = this.currentAyah + 1;

      if (nextAyah <= this.totalAyahsInSurah) {
        // Play next ayah immediately for continuous playback
        setTimeout(() => {
          this.playNextAyah(this.currentSurah!, nextAyah, this.currentReciter);
        }, 100); // Minimal 100ms pause for smooth transition
      } else {
        // Surah completed
        logger.debug(`Surah ${this.currentSurah} completed`);
        this.stopStatusPolling();
        this.callbacksList.forEach(callbacks => {
          callbacks.onPlaybackEnd?.();
        });
      }
    } else {
      this.stopStatusPolling();
      this.callbacksList.forEach(callbacks => {
        callbacks.onPlaybackEnd?.();
      });
    }
  }

  /**
   * Load and play Surah audio (ayah-by-ayah sequential mode)
   */
  async playSurah(
    surahNumber: number,
    reciter: string = 'ar.alafasy',
    startFromAyah: number = 1
  ): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      this.currentSurah = surahNumber;
      this.currentReciter = reciter;
      this.totalAyahsInSurah = this.getTotalAyahs(surahNumber);

      // Start sequential ayah playback
      await this.playNextAyah(surahNumber, startFromAyah, reciter);

      logger.debug(`Playing Surah ${surahNumber} from ayah ${startFromAyah} with ${reciter}`);
    } catch (error) {
      logger.error('Failed to play surah:', error);
      this.callbacksList.forEach(callbacks => {
        callbacks.onError?.(error as Error);
      });
      throw error;
    }
  }

  /**
   * Play next ayah in sequence
   */
  private async playNextAyah(
    surahNumber: number,
    ayahNumber: number,
    reciter: string
  ): Promise<void> {
    try {
      // Remove previous player
      if (this.player) {
        this.stopStatusPolling();
        this.player.remove();
        this.player = null;
      }

      this.currentAyah = ayahNumber;

      // Notify ayah change to all subscribers
      logger.debug(
        `📢 audioService: Notifying ${this.callbacksList.length} subscribers of ayah change to ${ayahNumber}`
      );
      this.callbacksList.forEach(callbacks => {
        callbacks.onAyahChange?.(ayahNumber);
      });

      // Get ayah audio URL
      let audioUrl = quranApi.getAyahAudioUrl(surahNumber, ayahNumber, reciter);

      logger.debug(`🎵 Attempting to play: ${audioUrl}`);

      // Try to load and play ayah
      try {
        this.player = createAudioPlayer({ uri: audioUrl });

        // Wait for player to load
        await new Promise<void>((resolve, reject) => {
          const checkLoaded = setInterval(() => {
            if (this.player?.isLoaded) {
              clearInterval(checkLoaded);
              resolve();
            }
          }, 50);

          // Timeout after 10 seconds
          setTimeout(() => {
            clearInterval(checkLoaded);
            reject(new Error('Audio loading timeout'));
          }, 10000);
        });

        // Set playback speed
        if (this.playbackSpeed !== 1.0) {
          this.player.setPlaybackRate(this.playbackSpeed, 'low');
        }

        // Start playback
        this.player.play();

        // Start status polling
        this.startStatusPolling();

        logger.debug(`✅ Playing Ayah ${surahNumber}:${ayahNumber}`);
      } catch (primaryError) {
        // If the reciter is not available, fallback to ar.alafasy
        if (reciter !== 'ar.alafasy') {
          logger.warn(`⚠️ Reciter ${reciter} not available, falling back to ar.alafasy`);
          audioUrl = quranApi.getAyahAudioUrl(surahNumber, ayahNumber, 'ar.alafasy');
          logger.debug(`🎵 Fallback URL: ${audioUrl}`);

          this.player = createAudioPlayer({ uri: audioUrl });

          // Wait for player to load
          await new Promise<void>((resolve, reject) => {
            const checkLoaded = setInterval(() => {
              if (this.player?.isLoaded) {
                clearInterval(checkLoaded);
                resolve();
              }
            }, 50);

            setTimeout(() => {
              clearInterval(checkLoaded);
              reject(new Error('Audio loading timeout'));
            }, 10000);
          });

          if (this.playbackSpeed !== 1.0) {
            this.player.setPlaybackRate(this.playbackSpeed, 'low');
          }

          this.player.play();
          this.startStatusPolling();
        } else {
          throw primaryError;
        }
      }
    } catch (error) {
      logger.error(`❌ Failed to play ayah ${ayahNumber}:`, error);
      this.callbacksList.forEach(callbacks => {
        callbacks.onError?.(error as Error);
      });
    }
  }

  /**
   * Play specific Ayah
   */
  async playAyah(
    surahNumber: number,
    ayahNumber: number,
    reciter: string = 'ar.alafasy'
  ): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Remove previous player
      if (this.player) {
        this.stopStatusPolling();
        this.player.remove();
        this.player = null;
      }

      const audioUrl = quranApi.getAyahAudioUrl(surahNumber, ayahNumber, reciter);

      this.player = createAudioPlayer({ uri: audioUrl });

      // Wait for player to load
      await new Promise<void>((resolve, reject) => {
        const checkLoaded = setInterval(() => {
          if (this.player?.isLoaded) {
            clearInterval(checkLoaded);
            resolve();
          }
        }, 50);

        setTimeout(() => {
          clearInterval(checkLoaded);
          reject(new Error('Audio loading timeout'));
        }, 10000);
      });

      if (this.playbackSpeed !== 1.0) {
        this.player.setPlaybackRate(this.playbackSpeed, 'low');
      }

      this.player.play();
      this.startStatusPolling();

      logger.debug(`Playing Ayah ${surahNumber}:${ayahNumber}`);
    } catch (error) {
      logger.error('Failed to play ayah:', error);
      this.callbacksList.forEach(callbacks => {
        callbacks.onError?.(error as Error);
      });
      throw error;
    }
  }

  /**
   * Pause playback
   */
  async pause(): Promise<void> {
    if (this.player) {
      this.player.pause();
      logger.debug('Playback paused');
    }
  }

  /**
   * Resume playback
   */
  async resume(): Promise<void> {
    if (this.player) {
      this.player.play();
      logger.debug('Playback resumed');
    }
  }

  /**
   * Stop playback
   */
  async stop(): Promise<void> {
    if (this.player) {
      this.player.pause();
      this.player.seekTo(0);
      this.stopStatusPolling();
      logger.debug('Playback stopped');
    }
  }

  /**
   * Seek to position (milliseconds)
   */
  async seekTo(positionMillis: number): Promise<void> {
    if (this.player) {
      const positionSeconds = positionMillis / 1000;
      this.player.seekTo(positionSeconds);
    }
  }

  /**
   * Set playback speed
   */
  async setPlaybackSpeed(speed: number): Promise<void> {
    if (speed < 0.5 || speed > 2.0) {
      throw new Error('Speed must be between 0.5 and 2.0');
    }

    this.playbackSpeed = speed;

    if (this.player) {
      this.player.setPlaybackRate(speed, 'low');
      logger.debug(`Playback speed set to ${speed}x`);
    }
  }

  /**
   * Get current playback status
   */
  async getStatus(): Promise<AudioStatus | null> {
    if (this.player) {
      return this.getPlayerStatus();
    }
    return null;
  }

  /**
   * Get audio state
   */
  async getAudioState(): Promise<AudioState | null> {
    const status = await this.getStatus();

    if (!status || !status.isLoaded) {
      return null;
    }

    return {
      isPlaying: status.isPlaying,
      isLoading: status.isBuffering,
      currentAyah: this.currentAyah ?? undefined,
      surahNumber: this.currentSurah ?? undefined,
      duration: status.durationMillis,
      position: status.positionMillis,
      speed: status.playbackRate,
      reciter: this.currentReciter,
    };
  }

  /**
   * Download and cache Surah audio
   * NOTE: Full Surah audio downloads are not currently supported
   * The app uses verse-by-verse streaming instead
   */
  async downloadSurah(
    surahNumber: number,
    reciter: string = 'ar.alafasy',
    onProgress?: (progress: number) => void
  ): Promise<boolean> {
    // Full Surah audio files are not available from our current API
    // We use verse-by-verse streaming instead which doesn't require downloads
    if (!this.hasLoggedDownloadMessage) {
      logger.debug(
        `ℹ️  Full Surah downloads not supported. Audio plays verse-by-verse (no download needed)`
      );
      this.hasLoggedDownloadMessage = true;
    }
    return false;
  }

  /**
   * Get cached audio path
   */
  private async getCachedAudioPath(surahNumber: number, reciter: string): Promise<string | null> {
    try {
      const cacheDir = `${FileSystem.cacheDirectory}quran_audio/`;
      const filePath = `${cacheDir}${reciter}_${surahNumber}.mp3`;

      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        return filePath;
      }

      return null;
    } catch (error) {
      logger.error('Error getting cached audio:', error);
      return null;
    }
  }

  /**
   * Check if Surah is cached
   * NOTE: Full Surah caching is not supported - always returns false
   */
  async isSurahCached(surahNumber: number, reciter: string = 'ar.alafasy'): Promise<boolean> {
    // Full Surah audio downloads are not supported
    // Audio plays verse-by-verse via streaming
    return false;
  }

  /**
   * Get cached audio size
   */
  async getCacheSize(): Promise<number> {
    try {
      const cacheDir = `${FileSystem.cacheDirectory}quran_audio/`;
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);

      if (!dirInfo.exists) {
        return 0;
      }

      const files = await FileSystem.readDirectoryAsync(cacheDir);
      let totalSize = 0;

      for (const file of files) {
        const fileInfo = await FileSystem.getInfoAsync(`${cacheDir}${file}`);
        if (fileInfo.exists && 'size' in fileInfo) {
          totalSize += fileInfo.size;
        }
      }

      return totalSize;
    } catch (error) {
      logger.error('Error getting cache size:', error);
      return 0;
    }
  }

  /**
   * Delete cached Surah audio
   */
  async deleteCachedSurah(surahNumber: number, reciter: string = 'ar.alafasy'): Promise<boolean> {
    try {
      const cacheDir = `${FileSystem.cacheDirectory}quran_audio/`;
      const filePath = `${cacheDir}${reciter}_${surahNumber}.mp3`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);

      if (fileInfo.exists) {
        await FileSystem.deleteAsync(filePath, { idempotent: true });
        logger.debug(`Deleted cached audio for Surah ${surahNumber}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`Error deleting cached Surah ${surahNumber}:`, error);
      return false;
    }
  }

  /**
   * Clear audio cache
   */
  async clearCache(): Promise<void> {
    try {
      const cacheDir = `${FileSystem.cacheDirectory}quran_audio/`;
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);

      if (dirInfo.exists) {
        await FileSystem.deleteAsync(cacheDir, { idempotent: true });
        logger.debug('Audio cache cleared');
      }
    } catch (error) {
      logger.error('Error clearing cache:', error);
      throw error;
    }
  }

  /**
   * Cleanup and unload
   */
  async cleanup(): Promise<void> {
    this.stopStatusPolling();

    if (this.player) {
      this.player.remove();
      this.player = null;
    }

    this.currentSurah = null;
    this.currentAyah = null;
    logger.debug('Audio service cleaned up');
  }

  /**
   * Get download progress for a Surah
   */
  async getDownloadProgress(surahNumber: number, reciter: string = 'ar.alafasy'): Promise<number> {
    // This would require implementing a download manager with progress tracking
    // Simplified version just checks if downloaded
    const isCached = await this.isSurahCached(surahNumber, reciter);
    return isCached ? 100 : 0;
  }

  /**
   * Batch download multiple Surahs
   */
  async downloadSurahs(
    surahNumbers: number[],
    reciter: string = 'ar.alafasy',
    onProgress?: (surah: number, progress: number) => void
  ): Promise<void> {
    for (const surahNumber of surahNumbers) {
      try {
        onProgress?.(surahNumber, 0);
        const success = await this.downloadSurah(surahNumber, reciter);
        onProgress?.(surahNumber, success ? 100 : 0);
      } catch (error) {
        logger.error(`Failed to download Surah ${surahNumber}:`, error);
        onProgress?.(surahNumber, 0);
      }
    }
  }
}

// Export singleton instance
export const audioService = new QuranAudioService();
export default audioService;
