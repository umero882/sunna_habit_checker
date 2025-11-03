/**
 * useQiblaDirection Hook
 * Manages Qibla direction calculation and device compass
 */

import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import {
  calculateQiblaDirection,
  calculateDistanceToKaaba,
  getCardinalDirection,
  getDirectionDescription,
  formatDistance,
} from '../services/qiblaService';

import { createLogger } from '../utils/logger';

const logger = createLogger('useQiblaDirection');

interface QiblaData {
  qiblaBearing: number; // Direction to Qibla in degrees (0-360)
  deviceHeading: number; // Current device compass heading
  qiblaOffset: number; // Difference between device heading and Qibla (for arrow rotation)
  cardinalDirection: string; // e.g., "NE"
  directionDescription: string; // e.g., "North-East"
  distanceToKaaba: number; // In kilometers
  distanceFormatted: string; // Human-readable
  location: {
    latitude: number;
    longitude: number;
  } | null;
}

interface UseQiblaDirectionReturn {
  qiblaData: QiblaData | null;
  isLoading: boolean;
  error: string | null;
  accuracy: 'high' | 'medium' | 'low' | null;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  calibrate: () => void;
}

/**
 * Hook to get Qibla direction using device location and compass
 */
export const useQiblaDirection = (): UseQiblaDirectionReturn => {
  const [qiblaData, setQiblaData] = useState<QiblaData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [accuracy, setAccuracy] = useState<'high' | 'medium' | 'low' | null>(null);
  const [deviceHeading, setDeviceHeading] = useState(0);

  /**
   * Request location permissions
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);
      return granted;
    } catch (err) {
      logger.error('Error requesting location permission:', err);
      setError('Failed to request location permission');
      return false;
    }
  }, []);

  /**
   * Get user's current location and calculate Qibla
   */
  const calculateQibla = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      // Calculate Qibla direction
      const qiblaBearing = calculateQiblaDirection(latitude, longitude);
      const distance = calculateDistanceToKaaba(latitude, longitude);

      // Calculate offset for arrow rotation
      const qiblaOffset = qiblaBearing - deviceHeading;

      // Update state
      setQiblaData({
        qiblaBearing,
        deviceHeading,
        qiblaOffset,
        cardinalDirection: getCardinalDirection(qiblaBearing),
        directionDescription: getDirectionDescription(qiblaBearing),
        distanceToKaaba: distance,
        distanceFormatted: formatDistance(distance),
        location: { latitude, longitude },
      });

      // Determine accuracy based on location accuracy
      const locationAccuracy = location.coords.accuracy || 0;
      if (locationAccuracy < 10) {
        setAccuracy('high');
      } else if (locationAccuracy < 50) {
        setAccuracy('medium');
      } else {
        setAccuracy('low');
      }

      setIsLoading(false);
    } catch (err: any) {
      logger.error('Error calculating Qibla:', err);
      setError(err.message || 'Failed to calculate Qibla direction');
      setIsLoading(false);
    }
  }, [deviceHeading]);

  /**
   * Subscribe to magnetometer (compass) updates
   */
  useEffect(() => {
    let subscription: any = null;

    const startCompass = async () => {
      try {
        // Check if magnetometer is available
        const available = await Magnetometer.isAvailableAsync();
        if (!available) {
          logger.warn('Magnetometer not available on this device');
          return;
        }

        // Set update interval (4 updates per second for smooth rotation)
        Magnetometer.setUpdateInterval(250);

        // Subscribe to compass updates
        subscription = Magnetometer.addListener((data: { x: number; y: number; z: number }) => {
          // Calculate heading from magnetometer data
          // atan2(y, x) gives angle in radians
          let heading = Math.atan2(data.y, data.x);

          // Convert to degrees
          heading = heading * (180 / Math.PI);

          // Normalize to 0-360
          heading = (heading + 360) % 360;

          // Update device heading
          setDeviceHeading(heading);

          // Recalculate Qibla offset
          if (qiblaData) {
            setQiblaData((prev) =>
              prev
                ? {
                    ...prev,
                    deviceHeading: heading,
                    qiblaOffset: prev.qiblaBearing - heading,
                  }
                : null
            );
          }
        });
      } catch (err) {
        logger.error('Error starting compass:', err);
      }
    };

    startCompass();

    // Cleanup
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [qiblaData]);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    const init = async () => {
      // Check if we already have permission
      const { status } = await Location.getForegroundPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);

      if (granted) {
        await calculateQibla();
      } else {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  /**
   * Recalculate when permission is granted
   */
  useEffect(() => {
    if (hasPermission && !qiblaData) {
      calculateQibla();
    }
  }, [hasPermission, qiblaData, calculateQibla]);

  /**
   * Calibrate compass (prompts user to move device in figure-8 pattern)
   */
  const calibrate = useCallback(() => {
    // This is a placeholder - actual calibration requires UI guidance
    logger.debug('Compass calibration requested');
    // Could show a modal with instructions to move device in figure-8
  }, []);

  return {
    qiblaData,
    isLoading,
    error,
    accuracy,
    hasPermission,
    requestPermission,
    calibrate,
  };
};
