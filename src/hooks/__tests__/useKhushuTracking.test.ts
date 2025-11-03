/**
 * useKhushuTracking Hook Tests
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import { useKhushuTracking } from '../useKhushuTracking';
import { supabase } from '../../services/supabase';

// Mock the supabase module
jest.mock('../../services/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

describe('useKhushuTracking', () => {
  const mockUser = { id: 'test-user-id' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default values', () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
    });

    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    });
    (supabase.from as jest.Mock).mockImplementation(mockFrom);

    const { result } = renderHook(() => useKhushuTracking());

    expect(result.current.khushuLevel).toBe(50);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSaving).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should load khushu level from database', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
    });

    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { khushu_level: 4 }, // DB scale: 1-5
        error: null,
      }),
    });
    (supabase.from as jest.Mock).mockImplementation(mockFrom);

    const { result } = renderHook(() => useKhushuTracking());

    await waitFor(() => {
      // 4 * 20 = 80 (converted to 0-100 scale)
      expect(result.current.khushuLevel).toBe(80);
    });
  });

  it('should save khushu level to database', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
    });

    const mockUpsert = jest.fn().mockResolvedValue({ error: null });
    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      upsert: mockUpsert,
    });
    (supabase.from as jest.Mock).mockImplementation(mockFrom);

    const { result } = renderHook(() => useKhushuTracking());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Save a new khushu level (60 on 0-100 scale = 3 on 1-5 scale)
    await result.current.saveKhushuLevel(60);

    await waitFor(() => {
      expect(result.current.isSaving).toBe(false);
      expect(result.current.khushuLevel).toBe(60);
    });

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: mockUser.id,
        khushu_level: 3, // 60 / 20 = 3
      }),
      expect.any(Object)
    );
  });

  it('should handle authentication error when loading', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: null },
    });

    const { result } = renderHook(() => useKhushuTracking());

    await waitFor(() => {
      expect(result.current.error).toBe('User not authenticated');
    });
  });

  it('should handle database error when loading', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
    });

    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'SOME_ERROR', message: 'Database error' },
      }),
    });
    (supabase.from as jest.Mock).mockImplementation(mockFrom);

    const { result } = renderHook(() => useKhushuTracking());

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });

  it('should convert khushu level correctly from DB scale to UI scale', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
    });

    const testCases = [
      { dbValue: 1, expectedUiValue: 20 },
      { dbValue: 2, expectedUiValue: 40 },
      { dbValue: 3, expectedUiValue: 60 },
      { dbValue: 4, expectedUiValue: 80 },
      { dbValue: 5, expectedUiValue: 100 },
    ];

    for (const testCase of testCases) {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { khushu_level: testCase.dbValue },
          error: null,
        }),
      });
      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const { result } = renderHook(() => useKhushuTracking());

      await waitFor(() => {
        expect(result.current.khushuLevel).toBe(testCase.expectedUiValue);
      });
    }
  });

  it('should provide refreshKhushuLevel function', () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
    });

    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    });
    (supabase.from as jest.Mock).mockImplementation(mockFrom);

    const { result } = renderHook(() => useKhushuTracking());

    expect(result.current.refreshKhushuLevel).toBeDefined();
    expect(typeof result.current.refreshKhushuLevel).toBe('function');
  });
});
