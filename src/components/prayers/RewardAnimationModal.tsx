/**
 * Reward Animation Modal
 * Shows animated reward points with congratulations/encouragement
 * for Jamaah (27×) vs Alone (1×) prayers
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Animated } from 'react-native';
import { theme } from '../../constants/theme';
import { BARAKAH_POINTS, JAMAAH_MULTIPLIER } from '../../constants/points';
import {
  getRandomJamaahMessage,
  getRandomAloneMessage,
  JAMAAH_HADITH,
} from '../../constants/messages';
import {
  usePointsAnimation,
  useScaleAnimation,
  useFadeAnimation,
} from '../../hooks/usePointsAnimation';

interface RewardAnimationModalProps {
  /** Whether modal is visible */
  visible: boolean;
  /** Whether prayer was in Jamaah (congregation) */
  isJamaah: boolean;
  /** Base Barakah points (before multiplier) */
  basePoints?: number;
  /** Callback when animation completes */
  onComplete: () => void;
}

export const RewardAnimationModal: React.FC<RewardAnimationModalProps> = ({
  visible,
  isJamaah,
  basePoints = BARAKAH_POINTS.PRAYER_ON_TIME,
  onComplete,
}) => {
  const [message, setMessage] = useState('');

  // Animation for counting multiplier (1 → 27 for Jamaah, just 1 for alone)
  const { animatedValue: multiplierValue, start: startMultiplier } = usePointsAnimation({
    from: 1,
    to: isJamaah ? JAMAAH_MULTIPLIER : 1,
    duration: isJamaah ? 1500 : 0, // Animate for Jamaah, instant for alone
    autoStart: false,
  });

  // Scale animation for celebration
  const { animatedValue: scaleValue, start: startScale } = useScaleAnimation(300);

  // Fade animation for modal
  const { animatedValue: fadeValue, start: startFade } = useFadeAnimation(300);

  // Start animations when modal becomes visible
  useEffect(() => {
    if (visible) {
      // Set random message
      setMessage(isJamaah ? getRandomJamaahMessage() : getRandomAloneMessage());

      // Start animations
      startFade();
      startScale();
      startMultiplier();

      // Auto-dismiss after duration
      const dismissTimeout = setTimeout(
        () => {
          onComplete();
        },
        isJamaah ? 3000 : 2000
      ); // Longer for Jamaah to enjoy the animation

      return () => clearTimeout(dismissTimeout);
    }
  }, [visible, isJamaah]);

  if (!visible) return null;

  // Create arrays for interpolation - both must have same length
  const createInterpolationArrays = () => {
    if (isJamaah) {
      const inputRange = Array.from({ length: JAMAAH_MULTIPLIER }, (_, i) => i + 1);
      const outputRange = Array.from({ length: JAMAAH_MULTIPLIER }, (_, i) => `${i + 1}`);
      return { inputRange, outputRange };
    } else {
      return { inputRange: [1, 1], outputRange: ['1', '1'] };
    }
  };

  const { inputRange, outputRange } = createInterpolationArrays();

  const multiplierText = multiplierValue.interpolate({
    inputRange,
    outputRange,
  });

  const totalPoints = isJamaah ? basePoints * JAMAAH_MULTIPLIER : basePoints;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onComplete}>
      <Animated.View style={[styles.overlay, { opacity: fadeValue }]}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              backgroundColor: isJamaah ? theme.colors.primary[50] : theme.colors.gray[50],
              borderColor: isJamaah ? theme.colors.primary[600] : theme.colors.gray[400],
              transform: [{ scale: scaleValue }],
              overflow: 'hidden', // Ensure content doesn't overflow
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            {isJamaah ? (
              <>
                <Text style={styles.headerIconJamaah}>⭐</Text>
                <Text style={[styles.headerText, { color: theme.colors.primary[700] }]}>
                  MashAllah!
                </Text>
                <Text style={styles.headerIconJamaah}>⭐</Text>
              </>
            ) : (
              <>
                <Text style={styles.headerIconAlone}>🤲</Text>
                <Text style={[styles.headerText, { color: theme.colors.text.primary }]}>
                  May Allah Accept
                </Text>
              </>
            )}
          </View>

          {/* Animated Multiplier */}
          <View style={styles.multiplierContainer}>
            <Animated.Text style={styles.multiplierNumber}>{multiplierText}</Animated.Text>
            <Text style={styles.multiplierSymbol}>×</Text>
          </View>

          {/* Points Display */}
          <View style={styles.pointsContainer}>
            <Text style={styles.pointsIcon}>✨</Text>
            <Text style={styles.pointsText}>{totalPoints}</Text>
            <Text style={styles.pointsLabel}>Barakah Points</Text>
          </View>

          {/* Message */}
          <View style={styles.messageContainer}>
            <Text
              style={[
                styles.message,
                { color: isJamaah ? theme.colors.primary[700] : theme.colors.text.primary },
              ]}
            >
              {message}
            </Text>
          </View>

          {/* Hadith (Jamaah only) */}
          {isJamaah && (
            <View style={styles.hadithContainer}>
              <Text style={styles.hadithQuote}>"{JAMAAH_HADITH.textEnglish}"</Text>
              <Text style={styles.hadithSource}>
                - {JAMAAH_HADITH.source} {JAMAAH_HADITH.reference}
              </Text>
            </View>
          )}

          {/* Footer Encouragement */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {isJamaah ? '✨ Keep it up! ✨' : '💪 Stay strong!'}
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%', // Limit height for web
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 3,
    ...theme.shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  headerIconJamaah: {
    fontSize: 32,
  },
  headerIconAlone: {
    fontSize: 32,
    marginRight: theme.spacing.sm,
  },
  headerText: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
  },
  multiplierContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  multiplierNumber: {
    fontSize: 72,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[600],
    lineHeight: 80,
  },
  multiplierSymbol: {
    fontSize: 48,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[600],
    marginLeft: theme.spacing.sm,
  },
  pointsContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.md,
  },
  pointsIcon: {
    fontSize: 24,
    marginBottom: theme.spacing.xs,
  },
  pointsText: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[700],
    marginBottom: theme.spacing.xs,
  },
  pointsLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  messageContainer: {
    marginBottom: theme.spacing.md,
  },
  message: {
    fontSize: theme.typography.fontSize.md,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  hadithContainer: {
    backgroundColor: theme.colors.primary[100],
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary[600],
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
  },
  hadithQuote: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: theme.spacing.xs,
  },
  hadithSource: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary[700],
    fontWeight: theme.typography.fontWeight.semibold,
    textAlign: 'right',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[600],
  },
});

export default RewardAnimationModal;
