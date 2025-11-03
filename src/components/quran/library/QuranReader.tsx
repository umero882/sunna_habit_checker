/**
 * QuranReader Component
 * Main reading view with scrollable verses
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { theme } from '../../../constants/theme';
import { useQuranReader } from '../../../hooks/useQuranReader';
import { useBookmarks } from '../../../hooks/useBookmarks';
import { useReadingPlan } from '../../../hooks/useReadingPlan';
import { Ayah } from '../../../types';
import { AyahTiming } from '../../../types/wordTiming';
import AyahCard from './AyahCard';
import AudioPlayer from './AudioPlayer';
import { wordTimingService } from '../../../services/wordTimingService';
import { quranDb } from '../../../services/quranDb';
import { SURAHS } from '../../../constants/quran';

import { createLogger } from '../../../utils/logger';

const logger = createLogger('QuranReader');

interface QuranReaderProps {
  surahNumber: number;
  initialAyah?: number;
  userId?: string;
  onAyahPress?: (ayah: Ayah) => void;
  onAyahLongPress?: (ayah: Ayah) => void;
  onSurahChange?: (surahNumber: number) => void;
}

/**
 * Calculate approximate pages read based on ayah range
 * Uses global Quran average (604 pages / 6236 ayahs ≈ 0.097 pages per ayah)
 * This is more accurate than per-surah calculation since ayah lengths vary significantly
 * Returns an integer since the database column is INTEGER type
 */
const calculatePagesRead = (surahNumber: number, fromAyah: number, toAyah: number): number => {
  const surah = SURAHS.find(s => s.number === surahNumber);
  if (!surah) return 0;

  const ayahsRead = toAyah - fromAyah + 1;

  // Use global average: 604 pages / 6236 verses = ~0.0968 pages per ayah
  // This accounts for the fact that ayahs vary greatly in length
  const PAGES_PER_AYAH = 604 / 6236;
  const pagesRead = ayahsRead * PAGES_PER_AYAH;

  // Round to nearest integer, with minimum of 1 if any ayahs were read
  return ayahsRead > 0 ? Math.max(1, Math.round(pagesRead)) : 0;
};

export const QuranReader: React.FC<QuranReaderProps> = ({
  surahNumber,
  initialAyah = 1,
  userId,
  onAyahPress,
  onAyahLongPress,
  onSurahChange,
}) => {
  const { surah, isLoading, isCached, currentAyah, goToAyah, saveProgress } = useQuranReader({
    surahNumber,
    translation: 'en.sahih',
    includeTransliteration: false,
    autoCache: true,
  });

  const { bookmarks, isBookmarked, addBookmark, removeBookmark } = useBookmarks(userId);

  const { logReading, activePlan } = useReadingPlan(userId || '');

  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);
  const [ayahTimings, setAyahTimings] = useState<Map<number, AyahTiming>>(new Map());
  const [reciterForTiming, setReciterForTiming] = useState<string>('');
  const [recentlyPlayedAyahs, setRecentlyPlayedAyahs] = useState<Set<number>>(new Set());
  const flatListRef = useRef<FlatList>(null);
  const lastUpdateTime = useRef<number>(0);
  const lastWordIndex = useRef<number>(-1);

  // Track reading session
  const sessionStartAyah = useRef<number>(initialAyah);
  const sessionEndAyah = useRef<number>(initialAyah);
  const sessionStartTime = useRef<number>(Date.now());
  const currentAyahRef = useRef<number>(currentAyah);
  const lastLoggedAyah = useRef<number>(0); // Track what we've already logged to prevent double-counting

  // Keep currentAyahRef in sync with currentAyah state
  useEffect(() => {
    currentAyahRef.current = currentAyah;
  }, [currentAyah]);

  // Periodic session logging (every 2 minutes)
  useEffect(() => {
    if (!userId || !activePlan) return;

    const logCurrentSession = async () => {
      const durationMinutes = Math.floor((Date.now() - sessionStartTime.current) / (1000 * 60));

      // Only log if at least 2 minutes have passed
      if (durationMinutes < 2) return;

      const startAyah = Math.min(sessionStartAyah.current, sessionEndAyah.current);
      const endAyah = Math.max(sessionStartAyah.current, sessionEndAyah.current);

      // Only log if there's progress
      if (endAyah < startAyah) return;

      // Calculate pages read
      const pagesRead = calculatePagesRead(surahNumber, startAyah, endAyah);

      try {
        logger.debug(
          `⏰ Periodic log: Surah ${surahNumber}, Ayahs ${startAyah}-${endAyah}, ${pagesRead} pages, ${durationMinutes} min`
        );
        await logReading({
          surah_number: surahNumber,
          from_ayah: startAyah,
          to_ayah: endAyah,
          pages_read: pagesRead,
          duration_minutes: durationMinutes,
        });
        logger.debug('✅ Periodic session logged!');

        // Mark this range as logged to prevent double-counting
        lastLoggedAyah.current = endAyah;

        // Reset session tracking for next period
        sessionStartAyah.current = endAyah;
        sessionEndAyah.current = endAyah;
        sessionStartTime.current = Date.now();
      } catch (error) {
        logger.error('❌ Failed to log periodic session:', error);
      }
    };

    // Log every 2 minutes
    const interval = setInterval(logCurrentSession, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [userId, activePlan, surahNumber, logReading]);

  // Load timing data when ayah changes
  useEffect(() => {
    const loadTimingForAyah = async () => {
      if (!playingAyah) return;

      // Check if we need to load timing for a new reciter
      // For now, we'll use a prop or default reciter
      const reciter = 'ar.alafasy'; // TODO: Get from AudioPlayer/props

      try {
        const timing = await wordTimingService.getAyahTiming(reciter, surahNumber, playingAyah);
        if (timing) {
          setAyahTimings(prev => {
            const updated = new Map(prev);
            updated.set(playingAyah, timing);
            return updated;
          });
          setReciterForTiming(reciter);
          logger.debug(
            `⏱️ Loaded timing data for Surah ${surahNumber}:${playingAyah} - ${timing.segments.length} words`
          );
        } else {
          logger.debug(`⏱️ No timing data for Surah ${surahNumber}:${playingAyah}`);
        }
      } catch (error) {
        logger.error(`Error loading timing data:`, error);
      }
    };

    loadTimingForAyah();
  }, [playingAyah, surahNumber]);

  // Scroll to initial ayah when surah loads
  useEffect(() => {
    if (surah && initialAyah > 1) {
      logger.debug(
        `🎯 Resume: Attempting to scroll to ayah ${initialAyah} in surah ${surahNumber}`
      );
      goToAyah(initialAyah);

      // Use multiple timeouts to ensure scrolling happens after FlatList renders
      // First attempt - quick
      const timer1 = setTimeout(() => {
        logger.debug(`🔄 First scroll attempt to ayah ${initialAyah}`);
        scrollToAyah(initialAyah);
      }, 500);

      // Second attempt - fallback
      const timer2 = setTimeout(() => {
        logger.debug(`🔄 Fallback scroll to ayah ${initialAyah}`);
        scrollToAyah(initialAyah);
      }, 1000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [surah, initialAyah, surahNumber]);

  // Log reading session when component unmounts or surah changes
  useEffect(() => {
    const logSession = async () => {
      if (!userId || !activePlan) return;

      const durationMinutes = Math.floor((Date.now() - sessionStartTime.current) / (1000 * 60));

      // Only log if user spent at least 30 seconds reading
      if (durationMinutes < 1 && Date.now() - sessionStartTime.current < 30000) {
        logger.debug('⏱️ Session too short to log (< 30 seconds)');
        return;
      }

      const startAyah = Math.min(sessionStartAyah.current, sessionEndAyah.current);
      const endAyah = Math.max(sessionStartAyah.current, sessionEndAyah.current);

      // Only log if user read at least 1 ayah beyond what was already logged
      if (endAyah <= lastLoggedAyah.current) {
        logger.debug(
          '📖 No new progress to log (already logged up to ayah',
          lastLoggedAyah.current,
          ')'
        );
        return;
      }

      // Only log if there's any progress at all
      if (endAyah < startAyah) {
        logger.debug('📖 No progress to log');
        return;
      }

      // Calculate pages read only for the NEW ayahs (not already logged)
      const actualStartAyah = Math.max(startAyah, lastLoggedAyah.current + 1);
      const pagesRead = calculatePagesRead(surahNumber, actualStartAyah, endAyah);

      try {
        logger.debug(
          `📝 Unmount: Logging NEW progress Surah ${surahNumber}, Ayahs ${actualStartAyah}-${endAyah}, ${pagesRead} pages, ${durationMinutes} min`
        );

        await logReading({
          surah_number: surahNumber,
          from_ayah: actualStartAyah,
          to_ayah: endAyah,
          pages_read: pagesRead,
          duration_minutes: durationMinutes > 0 ? durationMinutes : 1, // Minimum 1 minute
        });

        logger.debug('✅ Reading session logged successfully!');
        lastLoggedAyah.current = endAyah;
      } catch (error) {
        logger.error('❌ Failed to log reading session:', error);
      }
    };

    return () => {
      // Save final position when leaving
      if (currentAyah >= 1) {
        saveProgress();
      }
      // Log the reading session
      logSession();
    };
  }, [currentAyah, saveProgress, userId, activePlan, surahNumber, logReading]);

  // Auto-save progress when user scrolls
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const firstVisibleAyah = viewableItems[0]?.item?.number;
      if (firstVisibleAyah && firstVisibleAyah !== currentAyahRef.current) {
        logger.debug(`👁️ Viewable changed: switching to ayah ${firstVisibleAyah}`);

        // Update session tracking
        sessionEndAyah.current = firstVisibleAyah;

        // Update currentAyah ref immediately
        currentAyahRef.current = firstVisibleAyah;

        // Save progress with the correct ayah number
        quranDb
          .saveReadingProgress(surahNumber, firstVisibleAyah)
          .then(() => {
            logger.debug(
              `✅ Scroll: Saved progress Surah ${surahNumber}, Ayah ${firstVisibleAyah}`
            );
          })
          .catch(err => {
            logger.error('❌ Failed to save progress on scroll:', err);
          });
      }
    }
  });

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const scrollToAyah = (ayahNumber: number) => {
    if (surah && flatListRef.current) {
      const index = surah.ayahs.findIndex(a => a.number === ayahNumber);
      if (index >= 0) {
        try {
          flatListRef.current.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.1,
          });
          logger.debug(`📜 Scrolled to ayah ${ayahNumber} at index ${index}`);
        } catch (error) {
          logger.error(`Failed to scroll to ayah ${ayahNumber}:`, error);
          // Fallback: scroll with offset
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({
              index,
              animated: false,
              viewPosition: 0.1,
            });
          }, 100);
        }
      }
    }
  };

  const handleAyahPress = (ayah: Ayah) => {
    if (onAyahPress) {
      onAyahPress(ayah);
    }
  };

  const handleAyahLongPress = (ayah: Ayah) => {
    if (onAyahLongPress) {
      onAyahLongPress(ayah);
    } else {
      // Default: bookmark or copy
      logger.debug('Long press on ayah:', ayah.number);
    }
  };

  const handleBookmarkToggle = async (ayah: Ayah) => {
    if (!userId) return;

    try {
      const bookmarked = isBookmarked(surahNumber, ayah.number);
      if (bookmarked) {
        await removeBookmark(surahNumber, ayah.number);
      } else {
        await addBookmark(surahNumber, ayah.number);
      }
    } catch (error) {
      logger.error('Failed to toggle bookmark:', error);
    }
  };

  const renderAyahItem = ({ item }: { item: Ayah }) => {
    const isCurrentlyPlaying = playingAyah === item.number;
    const wasRecentlyPlayed = recentlyPlayedAyahs.has(item.number);
    const wordIndexForThisAyah = isCurrentlyPlaying ? currentWordIndex : -1;

    // Use WebView if currently playing OR recently played (keeps WebView mounted)
    const shouldUseWebView = isCurrentlyPlaying || wasRecentlyPlayed;

    return (
      <AyahCard
        ayah={item}
        isPlaying={isCurrentlyPlaying}
        shouldUseWebView={shouldUseWebView}
        isHighlighted={currentAyah === item.number}
        isBookmarked={isBookmarked(surahNumber, item.number)}
        currentWordIndex={wordIndexForThisAyah}
        onPress={() => handleAyahPress(item)}
        onLongPress={() => handleAyahLongPress(item)}
        onBookmarkToggle={userId ? () => handleBookmarkToggle(item) : undefined}
        showTranslation={true}
      />
    );
  };

  const renderHeader = () => {
    if (!surah) return null;

    return (
      <View style={styles.headerContainer}>
        {/* Bismillah for all surahs except At-Tawbah (9) */}
        {surahNumber !== 1 && surahNumber !== 9 && (
          <View style={styles.bismillahContainer}>
            <Text style={styles.bismillahText}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</Text>
          </View>
        )}

        {/* Surah Info */}
        <View style={styles.infoCard}>
          <Text style={styles.surahName}>{surah.name}</Text>
          <Text style={styles.surahNameArabic}>{surah.nameArabic}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{surah.revelationType}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>{surah.numberOfAyahs} Verses</Text>
            {isCached && (
              <>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.cachedText}>✓ Offline</Text>
              </>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (!surah) return null;

    return (
      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>End of {surah.name}</Text>
        <Text style={styles.footerSubtext}>{surah.numberOfAyahs} verses</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[600]} />
        <Text style={styles.loadingText}>Loading Surah...</Text>
      </View>
    );
  }

  if (!surah) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Failed to Load</Text>
        <Text style={styles.errorSubtitle}>
          Unable to fetch this Surah. Please check your connection.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={surah.ayahs}
        renderItem={renderAyahItem}
        keyExtractor={item => item.number.toString()}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={viewabilityConfig}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={100}
        onScrollToIndexFailed={info => {
          // Fallback for scroll failures
          logger.warn(`⚠️ Scroll failed for index ${info.index}, retrying...`);
          const wait = new Promise(resolve => setTimeout(resolve, 500));
          wait.then(() => {
            if (flatListRef.current && surah) {
              try {
                flatListRef.current.scrollToIndex({
                  index: info.index,
                  animated: false,
                  viewPosition: 0.1,
                });
                logger.debug(`✅ Retry scroll succeeded for index ${info.index}`);
              } catch (error) {
                logger.error(`❌ Retry scroll still failed:`, error);
              }
            }
          });
        }}
      />

      {/* Audio Player - Fixed at bottom */}
      <AudioPlayer
        surahNumber={surahNumber}
        currentAyah={currentAyah}
        userId={userId}
        onAyahChange={ayahNumber => {
          // Keep track of recently played ayahs for smooth transitions
          setRecentlyPlayedAyahs(prev => {
            const updated = new Set(prev);
            updated.add(ayahNumber);
            // Keep last 3 ayahs in memory for smooth transitions
            if (updated.size > 3) {
              const sorted = Array.from(updated).sort((a, b) => a - b);
              updated.delete(sorted[0]);
            }
            return updated;
          });

          setPlayingAyah(ayahNumber);
          scrollToAyah(ayahNumber);
          // Start with first word (index 0) instead of -1 for smooth start
          setCurrentWordIndex(0);
          lastWordIndex.current = 0;

          // Update session tracking for audio playback
          sessionEndAyah.current = ayahNumber;
        }}
        onPositionChange={positionMs => {
          // Update word highlighting based on timing data
          if (playingAyah && ayahTimings.has(playingAyah)) {
            const timing = ayahTimings.get(playingAyah)!;
            const wordIndex = wordTimingService.getCurrentWordIndex(timing.segments, positionMs);

            // Only update if word index actually changed AND it's different from last update
            if (wordIndex !== currentWordIndex && wordIndex !== lastWordIndex.current) {
              lastWordIndex.current = wordIndex;
              setCurrentWordIndex(wordIndex);
            }
          } else {
            // No timing data - reset word index
            if (currentWordIndex !== -1) {
              lastWordIndex.current = -1;
              setCurrentWordIndex(-1);
            }
          }
        }}
        onSurahComplete={async () => {
          // Surah playback is complete - log the session
          logger.debug(`Surah ${surahNumber} playback completed`);

          // Log the current reading session
          if (userId && activePlan) {
            const durationMinutes = Math.floor(
              (Date.now() - sessionStartTime.current) / (1000 * 60)
            );
            const startAyah = Math.min(sessionStartAyah.current, sessionEndAyah.current);
            const endAyah = Math.max(sessionStartAyah.current, sessionEndAyah.current);

            // Only log if there's new progress beyond what was already logged
            if (
              (durationMinutes >= 1 || Date.now() - sessionStartTime.current >= 30000) &&
              endAyah > lastLoggedAyah.current
            ) {
              // Calculate pages read only for the NEW ayahs (not already logged)
              const actualStartAyah = Math.max(startAyah, lastLoggedAyah.current + 1);
              const pagesRead = calculatePagesRead(surahNumber, actualStartAyah, endAyah);

              try {
                logger.debug(
                  `📝 Surah complete: Logging NEW progress Surah ${surahNumber}, Ayahs ${actualStartAyah}-${endAyah}, ${pagesRead} pages`
                );
                await logReading({
                  surah_number: surahNumber,
                  from_ayah: actualStartAyah,
                  to_ayah: endAyah,
                  pages_read: pagesRead,
                  duration_minutes: durationMinutes > 0 ? durationMinutes : 1,
                });
                logger.debug('✅ Session logged on surah completion!');

                // Mark this range as logged
                lastLoggedAyah.current = endAyah;

                // Reset session tracking for next reading
                sessionStartAyah.current = endAyah + 1;
                sessionEndAyah.current = endAyah + 1;
                sessionStartTime.current = Date.now();
              } catch (error) {
                logger.error('❌ Failed to log session on surah completion:', error);
              }
            }
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: 100, // Space for audio player
  },
  headerContainer: {
    marginBottom: theme.spacing.lg,
  },
  bismillahContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  bismillahText: {
    fontSize: theme.typography.fontSize.xxl,
    color: theme.colors.primary[700],
    fontWeight: theme.typography.fontWeight.semibold,
  },
  infoCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  surahName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  surahNameArabic: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.primary[600],
    marginBottom: theme.spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  metaDot: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    marginHorizontal: theme.spacing.sm,
  },
  cachedText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.success,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  footerContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    marginTop: theme.spacing.lg,
  },
  footerText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  footerSubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.xl,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  errorTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  errorSubtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});

export default QuranReader;
