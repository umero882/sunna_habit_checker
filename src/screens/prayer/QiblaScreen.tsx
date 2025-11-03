/**
 * QiblaScreen
 * Full-screen Qibla compass with permission handling and calibration
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { QiblaCompass } from '../../components/prayers/QiblaCompass';
import { useQiblaDirection } from '../../hooks/useQiblaDirection';
import { createLogger } from '../../utils/logger';

const logger = createLogger('QiblaScreen');

export const QiblaScreen: React.FC = () => {
  const { qiblaData, isLoading, error, accuracy, hasPermission, requestPermission, calibrate } =
    useQiblaDirection();

  const [showCalibrationGuide, setShowCalibrationGuide] = useState(false);

  // Request permission on mount if not already granted
  useEffect(() => {
    if (!hasPermission && !isLoading) {
      requestPermission();
    }
  }, [hasPermission, isLoading, requestPermission]);

  const handleCalibrate = () => {
    setShowCalibrationGuide(true);
    calibrate();
  };

  const handleDismissCalibrationGuide = () => {
    setShowCalibrationGuide(false);
  };

  // Show calibration guide modal
  if (showCalibrationGuide) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
        <View style={styles.calibrationGuide}>
          <Ionicons name="sync-circle-outline" size={80} color={theme.colors.primary[600]} />
          <Text style={[styles.calibrationTitle, { color: theme.colors.text.primary }]}>
            Calibrate Compass
          </Text>
          <Text style={[styles.calibrationText, { color: theme.colors.text.secondary }]}>
            Move your device in a figure-8 pattern to calibrate the compass.
          </Text>
          <View style={styles.calibrationSteps}>
            <Text style={[styles.stepText, { color: theme.colors.text.secondary }]}>
              1. Hold your phone flat in front of you
            </Text>
            <Text style={[styles.stepText, { color: theme.colors.text.secondary }]}>
              2. Move it in a figure-8 motion
            </Text>
            <Text style={[styles.stepText, { color: theme.colors.text.secondary }]}>
              3. Repeat 3-4 times
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.doneButton, { backgroundColor: theme.colors.primary[600] }]}
            onPress={handleDismissCalibrationGuide}
          >
            <Text style={[styles.doneButtonText, { color: '#FFFFFF' }]}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show permission request
  if (!hasPermission) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: theme.colors.background.primary },
        ]}
      >
        <Ionicons name="location-outline" size={64} color={theme.colors.text.tertiary} />
        <Text style={[styles.permissionTitle, { color: theme.colors.text.primary }]}>
          Location Permission Required
        </Text>
        <Text style={[styles.permissionText, { color: theme.colors.text.secondary }]}>
          We need your location to calculate the Qibla direction.
        </Text>
        <TouchableOpacity
          style={[styles.permissionButton, { backgroundColor: theme.colors.primary[600] }]}
          onPress={requestPermission}
        >
          <Ionicons name="location" size={20} color="#FFFFFF" />
          <Text style={[styles.permissionButtonText, { color: '#FFFFFF' }]}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: theme.colors.background.primary },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary[600]} />
        <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
          Calculating Qibla direction...
        </Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: theme.colors.background.primary },
        ]}
      >
        <Ionicons name="alert-circle-outline" size={64} color={theme.colors.error} />
        <Text style={[styles.errorTitle, { color: theme.colors.text.primary }]}>Error</Text>
        <Text style={[styles.errorText, { color: theme.colors.text.secondary }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.colors.primary[600] }]}
          onPress={requestPermission}
        >
          <Ionicons name="refresh" size={20} color="#FFFFFF" />
          <Text style={[styles.retryButtonText, { color: '#FFFFFF' }]}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show compass (main view)
  if (!qiblaData) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: theme.colors.background.primary },
        ]}
      >
        <Text style={[styles.noDataText, { color: theme.colors.text.secondary }]}>
          No Qibla data available
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
          Qibla Compass
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}>
          Point your phone toward the green arrow
        </Text>
      </View>

      {/* Compass */}
      <QiblaCompass
        qiblaBearing={qiblaData.qiblaBearing}
        deviceHeading={qiblaData.deviceHeading}
        qiblaOffset={qiblaData.qiblaOffset}
        cardinalDirection={qiblaData.cardinalDirection}
        directionDescription={qiblaData.directionDescription}
        distanceFormatted={qiblaData.distanceFormatted}
        accuracy={accuracy}
        onCalibrate={handleCalibrate}
      />

      {/* Location Info */}
      {qiblaData.location && (
        <View style={styles.locationInfo}>
          <Ionicons name="location" size={16} color={theme.colors.text.tertiary} />
          <Text style={[styles.locationText, { color: theme.colors.text.tertiary }]}>
            {qiblaData.location.latitude.toFixed(4)}°, {qiblaData.location.longitude.toFixed(4)}°
          </Text>
        </View>
      )}

      {/* Tips */}
      <View style={[styles.tipsContainer, { backgroundColor: theme.colors.background.secondary }]}>
        <Text style={[styles.tipsTitle, { color: theme.colors.text.primary }]}>
          Tips for Best Accuracy
        </Text>
        <View style={styles.tipsList}>
          <View style={styles.tipRow}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
            <Text style={[styles.tipText, { color: theme.colors.text.secondary }]}>
              Hold your phone flat (parallel to the ground)
            </Text>
          </View>
          <View style={styles.tipRow}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
            <Text style={[styles.tipText, { color: theme.colors.text.secondary }]}>
              Move away from metal objects and electronics
            </Text>
          </View>
          <View style={styles.tipRow}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
            <Text style={[styles.tipText, { color: theme.colors.text.secondary }]}>
              Calibrate if accuracy is low
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  noDataText: {
    fontSize: 16,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  locationText: {
    fontSize: 12,
    marginLeft: 6,
  },
  tipsContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  tipsList: {
    gap: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 12,
    lineHeight: 20,
  },
  calibrationGuide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  calibrationTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
  },
  calibrationText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  calibrationSteps: {
    alignSelf: 'stretch',
    marginBottom: 32,
  },
  stepText: {
    fontSize: 16,
    marginBottom: 12,
    paddingLeft: 20,
  },
  doneButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
