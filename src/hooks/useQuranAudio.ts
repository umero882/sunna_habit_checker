/**
 * useQuranAudio Hook
 * Manages audio playback state for Qur'an recitation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AudioState } from '../types';
import { audioService, AudioPlayerCallbacks, AudioStatus } from '../services/audioService';

import { createLogger } from '../utils/logger';

const logger = createLogger('useQuranAudio');

interface UseQuranAudioOptions {
  surahNumber?: number;
  reciter?: string;
  autoPlay?: boolean;
}

interface UseQuranAudioReturn {
  audioState: AudioState | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentPosition: number;
  duration: number;
  currentWordIndex: number; // NEW: Index of currently playing word (-1 if none)
  play: (surahNumber: number, startFromAyah?: number) => Promise<void>;
  playAyah: (surahNumber: number, ayahNumber: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  seekTo: (positionMillis: number) => Promise<void>;
  setSpeed: (speed: number) => Promise<void>;
  downloadSurah: (surahNumber: number, onProgress?: (progress: number) => void) => Promise<boolean>;
  isSurahCached: (surahNumber: number) => Promise<boolean>;
  deleteCachedSurah: (surahNumber: number) => Promise<boolean>;
  cleanup: () => Promise<void>;
}

export const useQuranAudio = ({
  surahNumber,
  reciter = 'ar.alafasy',
  autoPlay = false,
}: UseQuranAudioOptions = {}): UseQuranAudioReturn => {
  const [audioState, setAudioState] = useState<AudioState | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1); // NEW: Current word index
  const isInitializedRef = useRef(false);

  /**
   * Handle playback status updates
   */
  const handlePlaybackStatusUpdate = useCallback((status: AudioStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      setIsLoading(status.isBuffering);
      setCurrentPosition(status.positionMillis);
      setDuration(status.durationMillis ?? 0);

      // Update full audio state
      audioService.getAudioState().then((state) => {
        if (state) {
          setAudioState(state);
        }
      });
    }
  }, []);

  /**
   * Handle ayah change during playback
   */
  const handleAyahChange = useCallback((ayahNumber: number) => {
    logger.debug(`🎵 useQuranAudio: handleAyahChange called with ayahNumber=${ayahNumber}`);
    // Update audio state immediately when ayah changes
    audioService.getAudioState().then((state) => {
      if (state) {
        logger.debug(`✅ useQuranAudio: Audio state updated, currentAyah=${state.currentAyah}`);
        setAudioState(state);
      }
    });
    // Reset word index when ayah changes
    setCurrentWordIndex(-1);
  }, []);

  /**
   * Handle word position change during playback
   * Note: wordIndex is -1, positionMs is provided for subscriber to calculate actual index
   */
  const handleWordChange = useCallback((wordIndex: number, positionMs: number) => {
    // Store position for external components to use with timing data
    // The actual word index will be calculated by components with access to timing data
    setCurrentPosition(positionMs);
  }, []);

  /**
   * Handle playback end
   */
  const handlePlaybackEnd = useCallback(() => {
    setIsPlaying(false);
    logger.debug('Playback ended');
  }, []);

  /**
   * Handle errors
   */
  const handleError = useCallback((error: Error) => {
    logger.error('Audio playback error:', error);
    setIsPlaying(false);
    setIsLoading(false);
  }, []);

  /**
   * Initialize audio service
   */
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initAudio = async () => {
      if (!isInitializedRef.current) {
        try {
          await audioService.initialize();
          isInitializedRef.current = true;
        } catch (error) {
          logger.error('Failed to initialize audio:', error);
        }
      }

      // Always set up callbacks (even if already initialized)
      // This ensures each component using the hook gets its callbacks registered
      const callbacks: AudioPlayerCallbacks = {
        onPlaybackStatusUpdate: handlePlaybackStatusUpdate,
        onAyahChange: handleAyahChange,
        onWordChange: handleWordChange, // NEW: Word position tracking
        onPlaybackEnd: handlePlaybackEnd,
        onError: handleError,
      };

      unsubscribe = audioService.setCallbacks(callbacks);
    };

    initAudio();

    // Cleanup: unsubscribe callbacks when component unmounts
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [handlePlaybackStatusUpdate, handleAyahChange, handleWordChange, handlePlaybackEnd, handleError]);

  /**
   * Auto-play if enabled
   */
  useEffect(() => {
    if (autoPlay && surahNumber && isInitializedRef.current) {
      play(surahNumber);
    }
  }, [autoPlay, surahNumber]);

  /**
   * Play Surah
   */
  const play = useCallback(async (surahNum: number, startFromAyah: number = 1) => {
    setIsLoading(true);
    try {
      await audioService.playSurah(surahNum, reciter, startFromAyah);
    } catch (error) {
      logger.error('Failed to play surah:', error);
    } finally {
      setIsLoading(false);
    }
  }, [reciter]);

  /**
   * Play specific Ayah
   */
  const playAyah = useCallback(async (surahNum: number, ayahNumber: number) => {
    setIsLoading(true);
    try {
      await audioService.playAyah(surahNum, ayahNumber, reciter);
    } catch (error) {
      logger.error('Failed to play ayah:', error);
    } finally {
      setIsLoading(false);
    }
  }, [reciter]);

  /**
   * Pause playback
   */
  const pause = useCallback(async () => {
    await audioService.pause();
    setIsPlaying(false);
  }, []);

  /**
   * Resume playback
   */
  const resume = useCallback(async () => {
    await audioService.resume();
    setIsPlaying(true);
  }, []);

  /**
   * Stop playback
   */
  const stop = useCallback(async () => {
    await audioService.stop();
    setIsPlaying(false);
    setCurrentPosition(0);
  }, []);

  /**
   * Seek to position
   */
  const seekTo = useCallback(async (positionMillis: number) => {
    await audioService.seekTo(positionMillis);
    setCurrentPosition(positionMillis);
  }, []);

  /**
   * Set playback speed
   */
  const setSpeed = useCallback(async (speed: number) => {
    await audioService.setPlaybackSpeed(speed);
    if (audioState) {
      setAudioState({ ...audioState, speed });
    }
  }, [audioState]);

  /**
   * Download Surah for offline playback
   */
  const downloadSurah = useCallback(async (surahNum: number, onProgress?: (progress: number) => void): Promise<boolean> => {
    return await audioService.downloadSurah(surahNum, reciter, onProgress);
  }, [reciter]);

  /**
   * Check if Surah is cached
   */
  const isSurahCached = useCallback(async (surahNum: number): Promise<boolean> => {
    return await audioService.isSurahCached(surahNum, reciter);
  }, [reciter]);

  /**
   * Delete cached Surah
   */
  const deleteCachedSurah = useCallback(async (surahNum: number): Promise<boolean> => {
    return await audioService.deleteCachedSurah(surahNum, reciter);
  }, [reciter]);

  /**
   * Cleanup audio resources
   */
  const cleanup = useCallback(async () => {
    await audioService.cleanup();
    setAudioState(null);
    setIsPlaying(false);
    setCurrentPosition(0);
    setDuration(0);
  }, []);

  return {
    audioState,
    isPlaying,
    isLoading,
    currentPosition,
    duration,
    currentWordIndex,
    play,
    playAyah,
    pause,
    resume,
    stop,
    seekTo,
    setSpeed,
    downloadSurah,
    isSurahCached,
    deleteCachedSurah,
    cleanup,
  };
};

export default useQuranAudio;
