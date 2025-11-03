/**
 * Card Component
 * Reusable container component with shadow and theming
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../constants/theme';

export interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'small' | 'medium' | 'large';
  elevation?: 'none' | 'small' | 'medium' | 'large';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = 'medium',
  elevation = 'medium',
}) => {
  const containerStyle = [
    styles.base,
    elevation !== 'none' && styles[`elevation_${elevation}`],
    padding !== 'none' && styles[`padding_${padding}`],
    style,
  ];

  return <View style={containerStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
  },

  // Padding variants
  padding_small: {
    padding: theme.spacing.sm,
  },
  padding_medium: {
    padding: theme.spacing.md,
  },
  padding_large: {
    padding: theme.spacing.lg,
  },

  // Elevation variants
  elevation_small: {
    ...theme.shadows.sm,
  },
  elevation_medium: {
    ...theme.shadows.md,
  },
  elevation_large: {
    ...theme.shadows.lg,
  },
});

export default Card;
