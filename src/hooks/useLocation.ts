/**
 * useLocation Hook
 * React hook for managing location state and permissions
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Coordinates,
  LocationError,
  requestLocationPermission,
  checkLocationPermission,
  getLocationWithFallback,
  reverseGeocode,
} from '../services/location';
import { createLogger } from '../utils/logger';

const logger = createLogger('useLocation');

interface UseLocationState {
  coordinates: Coordinates | null;
  city: string | null;
  country: string | null;
  isLoading: boolean;
  error: LocationError | null;
  permissionGranted: boolean;
  canAskAgain: boolean;
}

interface UseLocationReturn extends UseLocationState {
  requestPermission: () => Promise<boolean>;
  refreshLocation: () => Promise<void>;
  clearError: () => void;
}

/**
 * Custom hook for managing user location
 * Handles permissions, fetching coordinates, and geocoding
 *
 * @example
 * const { coordinates, isLoading, error, requestPermission } = useLocation();
 *
 * useEffect(() => {
 *   if (!coordinates && !error) {
 *     requestPermission();
 *   }
 * }, []);
 */
export const useLocation = (): UseLocationReturn => {
  const [state, setState] = useState<UseLocationState>({
    coordinates: null,
    city: null,
    country: null,
    isLoading: false,
    error: null,
    permissionGranted: false,
    canAskAgain: true,
  });

  // Check permission status on mount
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const permission = await checkLocationPermission();
        setState((prev) => ({
          ...prev,
          permissionGranted: permission.granted,
          canAskAgain: permission.canAskAgain,
        }));

        // If permission already granted, fetch location
        if (permission.granted) {
          await fetchLocation();
        } else {
          // Auto-request permission on mount for better UX
          logger.debug('Location permission not granted, auto-requesting...');
          await requestPermission();
        }
      } catch (error) {
        logger.error('Error checking location permission:', error);
        setState((prev) => ({
          ...prev,
          error: {
            code: 'UNKNOWN',
            message: 'Failed to check location permission',
          },
          isLoading: false,
        }));
      }
    };

    checkPermission();
  }, []);

  /**
   * Request location permission from user
   * @returns true if permission granted, false otherwise
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const permission = await requestLocationPermission();

      setState((prev) => ({
        ...prev,
        permissionGranted: permission.granted,
        canAskAgain: permission.canAskAgain,
        isLoading: false,
      }));

      if (permission.granted) {
        await fetchLocation();
        return true;
      } else {
        setState((prev) => ({
          ...prev,
          error: {
            code: 'PERMISSION_DENIED',
            message: 'Location permission was denied',
          },
          isLoading: false,
        }));
        return false;
      }
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: {
          code: 'UNKNOWN',
          message: error.message || 'Failed to request permission',
        },
        isLoading: false,
      }));
      return false;
    }
  }, []);

  /**
   * Fetch current location coordinates and address info
   */
  const fetchLocation = async (): Promise<void> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get coordinates
      const coords = await getLocationWithFallback();

      // Get address info
      const address = await reverseGeocode(coords);

      setState((prev) => ({
        ...prev,
        coordinates: coords,
        city: address.city || null,
        country: address.country || null,
        isLoading: false,
        error: null,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error as LocationError,
        isLoading: false,
      }));
    }
  };

  /**
   * Refresh location data (useful for pull-to-refresh)
   */
  const refreshLocation = useCallback(async (): Promise<void> => {
    if (!state.permissionGranted) {
      return;
    }
    await fetchLocation();
  }, [state.permissionGranted]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    requestPermission,
    refreshLocation,
    clearError,
  };
};

/**
 * Simple hook that only returns coordinates without address info
 * Useful when you only need lat/lng for calculations
 */
export const useCoordinates = () => {
  const { coordinates, isLoading, error, requestPermission } = useLocation();

  return {
    coordinates,
    isLoading,
    error,
    requestPermission,
  };
};
