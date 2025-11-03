/**
 * AudioPlayer Component
 * Fixed bottom audio player with controls
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Slider from '@react-native-community/slider';
import { theme } from '../../../constants/theme';
import { useQuranAudio } from '../../../hooks/useQuranAudio';
import { useReciterPreference } from '../../../hooks/useReciterPreference';
import { ReciterSelector } from './ReciterSelector';

interface AudioPlayerProps {
  surahNumber: number;
  currentAyah?: number;
  userId?: string;
  onAyahChange?: (ayahNumber: number) => void;
  onPositionChange?: (positionMs: number) => void; // NEW: Position updates for word sync
  onSurahComplete?: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  surahNumber,
  currentAyah = 1,
  userId,
  onAyahChange,
  onPositionChange,
  onSurahComplete,
}) => {
  const {
    reciter,
    reciterInfo,
    setReciter,
    availableReciters,
  } = useReciterPreference(userId);

  const {
    isPlaying,
    isLoading,
    currentPosition,
    duration,
    play,
    pause,
    resume,
    stop,
    seekTo,
    setSpeed,
    audioState,
  } = useQuranAudio({
    reciter,
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [autoPlayAyahs, setAutoPlayAyahs] = useState(true);
  const [showReciterSelector, setShowReciterSelector] = useState(false);

  // Handle ayah change from audio playback
  useEffect(() => {
    if (audioState?.currentAyah) {
      onAyahChange?.(audioState.currentAyah);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioState?.currentAyah]);

  // Handle position changes for word synchronization
  useEffect(() => {
    if (isPlaying && currentPosition > 0) {
      onPositionChange?.(currentPosition);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPosition, isPlaying]);

  // NOTE: Removed the auto-advance to next Surah logic from here
  // The audioService handles ayah-by-ayah playback internally
  // We should NOT interfere with its sequential playback
  // Surah completion is handled by the onSurahComplete callback from QuranReader

  // Handle reciter change - stop and restart with new reciter
  useEffect(() => {
    const handleReciterChange = async () => {
      if (isPlaying && audioState?.surahNumber === surahNumber) {
        const currentAyahNumber = audioState.currentAyah || currentAyah;
        await stop();
        // Restart with new reciter from current ayah
        await play(surahNumber, currentAyahNumber);
      }
    };
    handleReciterChange();
  }, [reciter]);

  // Format time in MM:SS
  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle play/pause
  const handlePlayPause = async () => {
    if (isPlaying) {
      await pause();
    } else {
      // No need to download - we use verse-by-verse streaming
      // Just play directly
      if (audioState?.surahNumber === surahNumber) {
        await resume();
      } else {
        await play(surahNumber, currentAyah);
      }
    }
  };

  // Handle speed change
  const handleSpeedChange = async () => {
    const speeds = [0.75, 1.0, 1.25, 1.5];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];

    setPlaybackSpeed(newSpeed);
    await setSpeed(newSpeed);
  };

  // Handle seek
  const handleSeek = async (value: number) => {
    await seekTo(value);
  };

  // Toggle auto-play ayahs
  const handleToggleAutoPlay = () => {
    setAutoPlayAyahs(!autoPlayAyahs);
  };

  // Get total ayahs in current Surah
  const getTotalAyahs = (): number => {
    const { SURAHS } = require('../../../constants/quran');
    const surah = SURAHS.find((s: any) => s.number === surahNumber);
    return surah?.numberOfAyahs || 0;
  };

  const totalAyahs = getTotalAyahs();
  const currentPlayingAyah = audioState?.currentAyah || currentAyah;
  const nextAyah = currentPlayingAyah < totalAyahs ? currentPlayingAyah + 1 : null;

  if (!isExpanded) {
    // Compact Player
    return (
      <View style={styles.compactContainer}>
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setIsExpanded(true)}
        >
          <Text style={styles.expandIcon}>▲</Text>
        </TouchableOpacity>

        <View style={styles.compactInfo}>
          <View style={styles.compactTitleRow}>
            <Text style={styles.compactTitle}>Surah {surahNumber}</Text>
          </View>
          {isPlaying && currentPlayingAyah && (
            <Text style={styles.compactSubtitle}>
              Ayah {currentPlayingAyah}/{totalAyahs}
              {nextAyah && autoPlayAyahs && ` → ${nextAyah}`}
            </Text>
          )}
          {!isPlaying && autoPlayAyahs && (
            <Text style={styles.compactSubtitle}>Auto-play ON</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.compactPlayButton}
          onPress={handlePlayPause}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={theme.colors.text.inverse} />
          ) : (
            <Text style={styles.compactPlayIcon}>
              {isPlaying ? '⏸' : '▶'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  // Expanded Player
  return (
    <View style={styles.expandedContainer}>
      {/* Collapse Button */}
      <TouchableOpacity
        style={styles.collapseButton}
        onPress={() => setIsExpanded(false)}
      >
        <Text style={styles.collapseIcon}>▼</Text>
      </TouchableOpacity>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Text style={styles.timeText}>{formatTime(currentPosition)}</Text>
        <Slider
          style={styles.slider}
          value={currentPosition}
          minimumValue={0}
          maximumValue={duration || 1}
          onSlidingComplete={handleSeek}
          minimumTrackTintColor={theme.colors.primary[600]}
          maximumTrackTintColor={theme.colors.gray[300]}
          thumbTintColor={theme.colors.primary[600]}
        />
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        {/* Speed Control */}
        <TouchableOpacity
          style={styles.speedButton}
          onPress={handleSpeedChange}
        >
          <Text style={styles.speedText}>{playbackSpeed}x</Text>
        </TouchableOpacity>

        {/* Play/Pause */}
        <TouchableOpacity
          style={styles.playButton}
          onPress={handlePlayPause}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="large" color={theme.colors.text.inverse} />
          ) : (
            <Text style={styles.playIcon}>
              {isPlaying ? '⏸' : '▶'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Stop Button */}
        <TouchableOpacity
          style={styles.stopButton}
          onPress={stop}
          disabled={!isPlaying && !audioState}
        >
          <Text style={[
            styles.stopIcon,
            (!isPlaying && !audioState) && styles.stopIconDisabled,
          ]}>
            ⏹
          </Text>
        </TouchableOpacity>
      </View>

      {/* Additional Controls */}
      <View style={styles.additionalControls}>
        {/* Auto-play Ayahs Toggle */}
        <TouchableOpacity
          style={[
            styles.continuousPlayButton,
            autoPlayAyahs && styles.continuousPlayButtonActive,
          ]}
          onPress={handleToggleAutoPlay}
        >
          <Text style={styles.continuousPlayIcon}>▶️</Text>
          <Text style={styles.continuousPlayText}>
            {autoPlayAyahs ? 'Auto-play' : 'Manual'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Progress & Next Info */}
      <View style={styles.progressInfo}>
        {isPlaying && currentPlayingAyah && (
          <View style={styles.ayahProgressContainer}>
            <Text style={styles.ayahProgressText}>
              Ayah {currentPlayingAyah} of {totalAyahs}
            </Text>
            {nextAyah && autoPlayAyahs && (
              <Text style={styles.nextAyahText}>
                Next: Ayah {nextAyah}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Reciter Info - Clickable */}
      <TouchableOpacity
        style={styles.infoContainer}
        onPress={() => setShowReciterSelector(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.reciterLabel}>Reciter:</Text>
        <Text style={styles.reciterNameText}>
          {reciterInfo?.name || 'Loading...'}
        </Text>
        <Text style={styles.changeReciterText}>Tap to change</Text>
      </TouchableOpacity>

      {/* Reciter Selector Modal */}
      <ReciterSelector
        visible={showReciterSelector}
        currentReciter={reciter}
        availableReciters={availableReciters}
        onSelect={setReciter}
        onClose={() => setShowReciterSelector(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // Compact Player Styles
  compactContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.primary[700],
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    ...theme.shadows.lg,
  },
  expandButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.md,
  },
  expandIcon: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.md,
  },
  compactInfo: {
    flex: 1,
  },
  compactTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  compactTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
  },
  compactSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary[100],
    marginTop: 2,
  },
  compactPlayButton: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.secondary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactPlayIcon: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.lg,
  },

  // Expanded Player Styles
  expandedContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.primary[700],
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    ...theme.shadows.lg,
  },
  collapseButton: {
    alignSelf: 'center',
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  collapseIcon: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.md,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  slider: {
    flex: 1,
    marginHorizontal: theme.spacing.md,
  },
  timeText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary[100],
    fontWeight: theme.typography.fontWeight.medium,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  speedButton: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.lg,
  },
  speedText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.secondary[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: theme.spacing.md,
  },
  playIcon: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.xxl,
  },
  stopButton: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.lg,
  },
  stopIcon: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.lg,
  },
  stopIconDisabled: {
    opacity: 0.5,
  },
  additionalControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  continuousPlayButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary[600],
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  continuousPlayButtonActive: {
    backgroundColor: theme.colors.secondary[600],
  },
  continuousPlayIcon: {
    fontSize: theme.typography.fontSize.md,
  },
  continuousPlayText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  progressInfo: {
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  ayahProgressContainer: {
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  ayahProgressText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  nextAyahText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeight.medium,
  },
  infoContainer: {
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  reciterLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.xs,
  },
  reciterNameText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary[700],
    marginBottom: theme.spacing.xs,
  },
  changeReciterText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary[500],
  },
  nextSurahText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.secondary[200],
    marginTop: theme.spacing.xs,
  },
});

export default AudioPlayer;
