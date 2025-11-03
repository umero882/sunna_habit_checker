/**
 * Onboarding Slide Component
 * Reusable slide container with screenshot background and overlay
 * Enhanced with smooth fade-in animations
 */

import React, { ReactNode, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ScrollView,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../constants/theme';

export interface OnboardingSlideProps {
  // Background screenshot (optional, will use gradient if not provided)
  backgroundImage?: any; // require('../assets/...')

  // Content
  title: string;
  description: string;
  children?: ReactNode; // Additional custom content

  // Optional icon/illustration at top
  icon?: ReactNode;

  // Gradient overlay colors (defaults to green)
  gradientColors?: readonly [string, string, ...string[]];

  // Layout options
  scrollable?: boolean;

  // Skip button (will be positioned in top right)
  showSkip?: boolean;
  onSkip?: () => void;
  skipLabel?: string;
}

export const OnboardingSlide: React.FC<OnboardingSlideProps> = ({
  backgroundImage,
  title,
  description,
  children,
  icon,
  gradientColors = [
    'rgba(76, 175, 80, 0.95)', // primary green with high opacity
    'rgba(76, 175, 80, 0.85)',
    'rgba(76, 175, 80, 0.75)',
  ] as const,
  scrollable = false,
  showSkip = false,
  onSkip,
  skipLabel = 'Skip',
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const ContentWrapper = scrollable ? ScrollView : View;
  const wrapperProps = scrollable
    ? {
        contentContainerStyle: styles.scrollContent,
        showsVerticalScrollIndicator: false,
      }
    : { style: styles.content };

  const content = (
    <View style={styles.container}>
      {/* Background Image or Solid Color */}
      {backgroundImage ? (
        <ImageBackground
          source={backgroundImage}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : null}

      {/* Gradient Overlay */}
      <LinearGradient
        colors={gradientColors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Skip Button - Top Right Corner */}
      {showSkip && onSkip && (
        <TouchableOpacity style={styles.skipButton} onPress={onSkip} activeOpacity={0.7}>
          <Text style={styles.skipButtonText}>{skipLabel}</Text>
        </TouchableOpacity>
      )}

      {/* Safe Area Content with Fade-in Animation */}
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Animated.View
          style={{
            flex: 1,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <ContentWrapper {...wrapperProps}>
            {/* Icon/Illustration */}
            {icon && <View style={styles.iconContainer}>{icon}</View>}

            {/* Title */}
            <Text style={styles.title}>{title}</Text>

            {/* Description */}
            <Text style={styles.description}>{description}</Text>

            {/* Additional Content */}
            {children && <View style={styles.childrenContainer}>{children}</View>}
          </ContentWrapper>
        </Animated.View>
      </SafeAreaView>
    </View>
  );

  return content;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary[600],
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl * 2, // Extra bottom padding for scrollable content
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 40,
  },
  description: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.white,
    textAlign: 'center',
    lineHeight: 28,
    opacity: 0.95,
    marginBottom: theme.spacing.xl,
  },
  childrenContainer: {
    marginTop: theme.spacing.lg,
  },
  skipButton: {
    position: 'absolute',
    top: theme.spacing.xl + 40, // Account for status bar
    right: theme.spacing.xl,
    zIndex: 10,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  skipButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.white,
  },
});

export default OnboardingSlide;
