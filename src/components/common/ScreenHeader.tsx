/**
 * ScreenHeader Component
 * Reusable header with title and profile avatar in top-right corner
 * Used across all main app screens
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { ProfileAvatar } from './ProfileAvatar';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  rightComponent?: React.ReactNode;
  showAvatar?: boolean;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  rightComponent,
  showAvatar = true,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {rightComponent ? (
        <View style={styles.rightContainer}>{rightComponent}</View>
      ) : showAvatar ? (
        <ProfileAvatar size={44} />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  textContainer: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  rightContainer: {
    marginLeft: theme.spacing.sm,
  },
});

export default ScreenHeader;
