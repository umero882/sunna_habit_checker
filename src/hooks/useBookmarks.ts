/**
 * useBookmarks Hook
 * Manages Qur'an verse bookmarks
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

import { createLogger } from '../utils/logger';

const logger = createLogger('useBookmarks');

export interface Bookmark {
  id: string;
  user_id: string;
  surah_number: number;
  ayah_number: number;
  note?: string;
  created_at: string;
}

interface UseBookmarksReturn {
  bookmarks: Bookmark[];
  isLoading: boolean;
  error: Error | null;
  addBookmark: (surahNumber: number, ayahNumber: number, note?: string) => Promise<void>;
  removeBookmark: (surahNumber: number, ayahNumber: number) => Promise<void>;
  isBookmarked: (surahNumber: number, ayahNumber: number) => boolean;
  updateBookmarkNote: (bookmarkId: string, note: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useBookmarks = (userId?: string): UseBookmarksReturn => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch all bookmarks for user
   */
  const fetchBookmarks = useCallback(async () => {
    if (!userId) {
      setBookmarks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('quran_bookmarks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setBookmarks(data || []);
    } catch (err) {
      logger.error('Error fetching bookmarks:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  /**
   * Add a new bookmark
   */
  const addBookmark = useCallback(
    async (surahNumber: number, ayahNumber: number, note?: string) => {
      if (!userId) throw new Error('User ID required');

      try {
        const { error: insertError } = await supabase.from('quran_bookmarks').insert([
          {
            user_id: userId,
            surah_number: surahNumber,
            ayah_number: ayahNumber,
            note: note || null,
          },
        ]);

        if (insertError) throw insertError;

        await fetchBookmarks();
        logger.debug(`Bookmark added: Surah ${surahNumber}:${ayahNumber}`);
      } catch (err) {
        logger.error('Error adding bookmark:', err);
        throw err;
      }
    },
    [userId, fetchBookmarks]
  );

  /**
   * Remove a bookmark
   */
  const removeBookmark = useCallback(
    async (surahNumber: number, ayahNumber: number) => {
      if (!userId) throw new Error('User ID required');

      try {
        const { error: deleteError } = await supabase
          .from('quran_bookmarks')
          .delete()
          .eq('user_id', userId)
          .eq('surah_number', surahNumber)
          .eq('ayah_number', ayahNumber);

        if (deleteError) throw deleteError;

        await fetchBookmarks();
        logger.debug(`Bookmark removed: Surah ${surahNumber}:${ayahNumber}`);
      } catch (err) {
        logger.error('Error removing bookmark:', err);
        throw err;
      }
    },
    [userId, fetchBookmarks]
  );

  /**
   * Check if a verse is bookmarked
   */
  const isBookmarked = useCallback(
    (surahNumber: number, ayahNumber: number): boolean => {
      return bookmarks.some(b => b.surah_number === surahNumber && b.ayah_number === ayahNumber);
    },
    [bookmarks]
  );

  /**
   * Update bookmark note
   */
  const updateBookmarkNote = useCallback(
    async (bookmarkId: string, note: string) => {
      try {
        const { error: updateError } = await supabase
          .from('quran_bookmarks')
          .update({ note })
          .eq('id', bookmarkId);

        if (updateError) throw updateError;

        await fetchBookmarks();
        logger.debug('Bookmark note updated');
      } catch (err) {
        logger.error('Error updating bookmark note:', err);
        throw err;
      }
    },
    [fetchBookmarks]
  );

  /**
   * Refetch bookmarks
   */
  const refetch = useCallback(async () => {
    await fetchBookmarks();
  }, [fetchBookmarks]);

  /**
   * Load bookmarks on mount
   */
  useEffect(() => {
    if (userId) {
      fetchBookmarks();
    }
  }, [userId, fetchBookmarks]);

  return {
    bookmarks,
    isLoading,
    error,
    addBookmark,
    removeBookmark,
    isBookmarked,
    updateBookmarkNote,
    refetch,
  };
};

export default useBookmarks;
