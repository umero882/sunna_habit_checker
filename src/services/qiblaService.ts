/**
 * Qibla Service
 * Calculates the direction to Makkah from user's location
 */

import { createLogger } from '../utils/logger';

const logger = createLogger('qiblaService');

// Kaaba coordinates (Makkah)
const KAABA_LATITUDE = 21.4225;
const KAABA_LONGITUDE = 39.8262;

/**
 * Calculate Qibla direction (bearing) from a given location
 * @param latitude - User's latitude
 * @param longitude - User's longitude
 * @returns Bearing in degrees (0-360) where 0 is North
 */
export const calculateQiblaDirection = (latitude: number, longitude: number): number => {
  // Convert to radians
  const lat1 = toRadians(latitude);
  const lon1 = toRadians(longitude);
  const lat2 = toRadians(KAABA_LATITUDE);
  const lon2 = toRadians(KAABA_LONGITUDE);

  // Calculate bearing using formula:
  // θ = atan2(sin(Δlong)⋅cos(lat2), cos(lat1)⋅sin(lat2) − sin(lat1)⋅cos(lat2)⋅cos(Δlong))
  const dLon = lon2 - lon1;

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  let bearing = Math.atan2(y, x);

  // Convert from radians to degrees
  bearing = toDegrees(bearing);

  // Normalize to 0-360
  bearing = (bearing + 360) % 360;

  logger.debug(`Qibla direction calculated: ${bearing.toFixed(2)}°`);

  return bearing;
};

/**
 * Calculate distance to Kaaba in kilometers
 * @param latitude - User's latitude
 * @param longitude - User's longitude
 * @returns Distance in kilometers
 */
export const calculateDistanceToKaaba = (latitude: number, longitude: number): number => {
  const R = 6371; // Earth's radius in kilometers

  const lat1 = toRadians(latitude);
  const lon1 = toRadians(longitude);
  const lat2 = toRadians(KAABA_LATITUDE);
  const lon2 = toRadians(KAABA_LONGITUDE);

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  // Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  logger.debug(`Distance to Kaaba: ${distance.toFixed(2)} km`);

  return distance;
};

/**
 * Get cardinal direction from bearing
 * @param bearing - Bearing in degrees (0-360)
 * @returns Cardinal direction (e.g., "NE", "SW")
 */
export const getCardinalDirection = (bearing: number): string => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
};

/**
 * Get detailed direction description
 * @param bearing - Bearing in degrees (0-360)
 * @returns Human-readable direction (e.g., "North-East")
 */
export const getDirectionDescription = (bearing: number): string => {
  const descriptions = [
    'North',
    'North-East',
    'East',
    'South-East',
    'South',
    'South-West',
    'West',
    'North-West',
  ];
  const index = Math.round(bearing / 45) % 8;
  return descriptions[index];
};

/**
 * Format distance in a human-readable way
 * @param kilometers - Distance in kilometers
 * @returns Formatted string (e.g., "1,234 km" or "12,345 km")
 */
export const formatDistance = (kilometers: number): string => {
  if (kilometers < 1) {
    return `${Math.round(kilometers * 1000)} m`;
  }
  return `${Math.round(kilometers).toLocaleString()} km`;
};

// Helper functions
const toRadians = (degrees: number): number => {
  return (degrees * Math.PI) / 180;
};

const toDegrees = (radians: number): number => {
  return (radians * 180) / Math.PI;
};

/**
 * Check if coordinates are valid
 */
export const isValidCoordinates = (latitude: number, longitude: number): boolean => {
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
};
