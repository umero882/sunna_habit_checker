/**
 * Location Service
 * Handles location permissions and GPS access for prayer time calculations
 */

import * as Location from 'expo-location';

import { createLogger } from '../utils/logger';

const logger = createLogger('location');

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationError {
  code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'UNKNOWN';
  message: string;
}

/**
 * Request location permissions from the user
 * @returns Permission status object
 */
export const requestLocationPermission = async (): Promise<{
  granted: boolean;
  canAskAgain: boolean;
}> => {
  try {
    const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
    return {
      granted: status === 'granted',
      canAskAgain,
    };
  } catch (error) {
    logger.error('Error requesting location permission:', error);
    return {
      granted: false,
      canAskAgain: false,
    };
  }
};

/**
 * Check current location permission status
 * @returns Permission status object
 */
export const checkLocationPermission = async (): Promise<{
  granted: boolean;
  canAskAgain: boolean;
}> => {
  try {
    const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
    return {
      granted: status === 'granted',
      canAskAgain,
    };
  } catch (error) {
    logger.error('Error checking location permission:', error);
    return {
      granted: false,
      canAskAgain: false,
    };
  }
};

/**
 * Get the user's current location coordinates
 * @returns Coordinates object with latitude and longitude
 * @throws LocationError if permission denied or location unavailable
 */
export const getCurrentLocation = async (): Promise<Coordinates> => {
  try {
    // Check permission first
    const permission = await checkLocationPermission();

    if (!permission.granted) {
      throw {
        code: 'PERMISSION_DENIED',
        message: 'Location permission not granted',
      } as LocationError;
    }

    // Get current position
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error: any) {
    if (error.code === 'PERMISSION_DENIED') {
      throw error;
    }

    logger.error('Error getting current location:', error);
    throw {
      code: 'POSITION_UNAVAILABLE',
      message: 'Unable to retrieve location',
    } as LocationError;
  }
};

/**
 * Get the user's last known location (faster but potentially less accurate)
 * @returns Coordinates object or null if not available
 */
export const getLastKnownLocation = async (): Promise<Coordinates | null> => {
  try {
    const permission = await checkLocationPermission();

    if (!permission.granted) {
      return null;
    }

    const location = await Location.getLastKnownPositionAsync();

    if (!location) {
      return null;
    }

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    logger.error('Error getting last known location:', error);
    return null;
  }
};

/**
 * Get location with automatic fallback strategy:
 * 1. Try last known location (fast)
 * 2. If not available, get current location (accurate but slower)
 * @returns Coordinates object
 */
export const getLocationWithFallback = async (): Promise<Coordinates> => {
  // Try last known location first (fast)
  const lastKnown = await getLastKnownLocation();

  if (lastKnown) {
    return lastKnown;
  }

  // Fall back to current location if last known is not available
  return getCurrentLocation();
};

/**
 * Reverse geocode coordinates to get address information
 * @param coordinates Latitude and longitude
 * @returns Address information including city and country
 */
export const reverseGeocode = async (
  coordinates: Coordinates
): Promise<{
  city?: string;
  country?: string;
  region?: string;
  timezone?: string;
}> => {
  try {
    const addresses = await Location.reverseGeocodeAsync({
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    });

    if (addresses.length > 0) {
      const address = addresses[0];
      return {
        city: address.city || undefined,
        country: address.country || undefined,
        region: address.region || undefined,
        timezone: address.timezone || undefined,
      };
    }

    return {};
  } catch (error) {
    logger.error('Error reverse geocoding:', error);
    return {};
  }
};

/**
 * Open device settings to allow user to manually enable location
 */
export const openLocationSettings = async (): Promise<void> => {
  try {
    // Note: This requires expo-linking and app.json configuration
    // For now, we'll log a message
    logger.debug('Please enable location permission in your device settings');
  } catch (error) {
    logger.error('Error opening location settings:', error);
  }
};
