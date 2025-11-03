/**
 * QiblaCompass Component
 * Visual compass showing Qibla direction with prayer mat orientation
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { createLogger } from '../../utils/logger';

const logger = createLogger('QiblaCompass');

const { width } = Dimensions.get('window');
const COMPASS_SIZE = Math.min(width * 0.8, 320);

interface QiblaCompassProps {
  qiblaBearing: number; // Direction to Qibla (0-360)
  deviceHeading: number; // Current device orientation
  qiblaOffset: number; // Offset for rotation
  cardinalDirection: string; // e.g., "NE"
  directionDescription: string; // e.g., "North-East"
  distanceFormatted: string; // e.g., "1,234 km"
  accuracy: 'high' | 'medium' | 'low' | null;
  onCalibrate?: () => void;
}

export const QiblaCompass: React.FC<QiblaCompassProps> = ({
  qiblaBearing,
  deviceHeading,
  qiblaOffset,
  cardinalDirection,
  directionDescription,
  distanceFormatted,
  accuracy,
  onCalibrate,
}) => {
  const compassRotation = useRef(new Animated.Value(0)).current;
  const needleRotation = useRef(new Animated.Value(0)).current;

  // Rotate compass ring based on device heading
  useEffect(() => {
    Animated.timing(compassRotation, {
      toValue: -deviceHeading,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [deviceHeading, compassRotation]);

  // Rotate needle based on Qibla offset
  useEffect(() => {
    Animated.timing(needleRotation, {
      toValue: qiblaOffset,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [qiblaOffset, needleRotation]);

  // Get accuracy color
  const getAccuracyColor = () => {
    if (!accuracy) return theme.colors.text.tertiary;
    if (accuracy === 'high') return theme.colors.success;
    if (accuracy === 'medium') return theme.colors.warning;
    return theme.colors.error;
  };

  const getAccuracyText = () => {
    if (!accuracy) return 'Calculating...';
    if (accuracy === 'high') return 'High Accuracy';
    if (accuracy === 'medium') return 'Medium Accuracy';
    return 'Low Accuracy - Calibrate';
  };

  return (
    <View style={styles.container}>
      {/* Accuracy Indicator */}
      <View style={styles.accuracyContainer}>
        <View style={[styles.accuracyDot, { backgroundColor: getAccuracyColor() }]} />
        <Text style={[styles.accuracyText, { color: getAccuracyColor() }]}>
          {getAccuracyText()}
        </Text>
        {accuracy === 'low' && onCalibrate && (
          <TouchableOpacity onPress={onCalibrate} style={styles.calibrateButton}>
            <Ionicons name="sync-outline" size={16} color={theme.colors.primary[600]} />
            <Text style={[styles.calibrateText, { color: theme.colors.primary[600] }]}>
              Calibrate
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Compass Container */}
      <View style={[styles.compassContainer, { width: COMPASS_SIZE, height: COMPASS_SIZE }]}>
        {/* Compass Ring with Cardinal Directions */}
        <Animated.View
          style={[
            styles.compassRing,
            {
              transform: [
                {
                  rotate: compassRotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        >
          {/* North Marker (Red) */}
          <View style={[styles.cardinalMarker, styles.northMarker, { top: 5 }]}>
            <Text style={[styles.cardinalText, { color: theme.colors.error }]}>N</Text>
          </View>

          {/* East Marker */}
          <View style={[styles.cardinalMarker, { right: 5 }]}>
            <Text style={[styles.cardinalText, { color: theme.colors.text.secondary }]}>E</Text>
          </View>

          {/* South Marker */}
          <View style={[styles.cardinalMarker, { bottom: 5 }]}>
            <Text style={[styles.cardinalText, { color: theme.colors.text.secondary }]}>S</Text>
          </View>

          {/* West Marker */}
          <View style={[styles.cardinalMarker, { left: 5 }]}>
            <Text style={[styles.cardinalText, { color: theme.colors.text.secondary }]}>W</Text>
          </View>

          {/* Degree Markers */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map(degree => {
            const angle = (degree * Math.PI) / 180;
            const markerRadius = COMPASS_SIZE / 2 - 30;
            const x = Math.sin(angle) * markerRadius;
            const y = -Math.cos(angle) * markerRadius;

            return (
              <View
                key={degree}
                style={[
                  styles.degreeMarker,
                  {
                    left: COMPASS_SIZE / 2 + x - 2,
                    top: COMPASS_SIZE / 2 + y - 2,
                    backgroundColor:
                      degree % 90 === 0 ? theme.colors.primary[600] : theme.colors.text.tertiary,
                  },
                ]}
              />
            );
          })}

          {/* Compass Ring Circle */}
          <View
            style={[
              styles.ringCircle,
              {
                borderColor: theme.colors.border.light,
                backgroundColor: theme.colors.background.secondary,
              },
            ]}
          />
        </Animated.View>

        {/* Qibla Needle (Green, rotates toward Qibla) */}
        <Animated.View
          style={[
            styles.needleContainer,
            {
              transform: [
                {
                  rotate: needleRotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Needle Point (Green - toward Qibla) */}
          <View style={[styles.needlePoint, { borderBottomColor: theme.colors.success }]} />
          {/* Needle Tail (Gray - opposite direction) */}
          <View style={[styles.needleTail, { borderTopColor: theme.colors.text.tertiary }]} />
          {/* Center Dot */}
          <View style={[styles.centerDot, { backgroundColor: theme.colors.success }]} />
        </Animated.View>

        {/* Prayer Mat Icon (Center) */}
        <View style={styles.prayerMatIcon}>
          <Ionicons name="person-outline" size={32} color={theme.colors.primary[600]} />
          <Text style={[styles.prayerMatText, { color: theme.colors.text.secondary }]}>
            Face this way
          </Text>
        </View>
      </View>

      {/* Direction Info */}
      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>
            Qibla Direction
          </Text>
          <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
            {Math.round(qiblaBearing)}° {cardinalDirection}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>
            Cardinal Direction
          </Text>
          <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
            {directionDescription}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>
            Distance to Kaaba
          </Text>
          <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
            {distanceFormatted}
          </Text>
        </View>
      </View>

      {/* Kaaba Icon and Label */}
      <View style={styles.kaabaContainer}>
        <Ionicons name="business-outline" size={24} color={theme.colors.secondary[600]} />
        <Text style={[styles.kaabaText, { color: theme.colors.secondary[600] }]}>
          Kaaba, Makkah
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  accuracyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  accuracyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  accuracyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  calibrateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  calibrateText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  compassContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  compassRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringCircle: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: COMPASS_SIZE / 2,
    borderWidth: 2,
  },
  cardinalMarker: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  northMarker: {
    // North is special (red)
  },
  cardinalText: {
    fontSize: 20,
    fontWeight: '700',
  },
  degreeMarker: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  needleContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  needlePoint: {
    position: 'absolute',
    top: 30,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 60,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  needleTail: {
    position: 'absolute',
    bottom: 30,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 40,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  centerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    position: 'absolute',
  },
  prayerMatIcon: {
    alignItems: 'center',
    marginTop: 10,
  },
  prayerMatText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  infoContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  kaabaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  kaabaText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});
