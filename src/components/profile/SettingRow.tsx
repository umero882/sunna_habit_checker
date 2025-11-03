/**
 * SettingRow Component
 * Reusable row component for settings with various types
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { theme } from '../../constants/theme';

export type SettingRowType = 'toggle' | 'navigation' | 'info' | 'select';

interface SettingRowProps {
  type: SettingRowType;
  label: string;
  description?: string;
  value?: string | boolean;
  icon?: React.ReactNode;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
}

export const SettingRow: React.FC<SettingRowProps> = ({
  type,
  label,
  description,
  value,
  icon,
  onPress,
  onToggle,
  disabled = false,
  loading = false,
}) => {
  const handlePress = () => {
    if (!disabled && !loading && onPress) {
      onPress();
    }
  };

  const handleToggle = (newValue: boolean) => {
    if (!disabled && !loading && onToggle) {
      onToggle(newValue);
    }
  };

  const renderRightContent = () => {
    if (loading) {
      return <ActivityIndicator size="small" color={theme.colors.primary[600]} />;
    }

    switch (type) {
      case 'toggle':
        return (
          <Switch
            value={value as boolean}
            onValueChange={handleToggle}
            trackColor={{
              false: theme.colors.gray[300],
              true: theme.colors.primary[400],
            }}
            thumbColor={value ? theme.colors.primary[600] : theme.colors.gray[50]}
            disabled={disabled}
          />
        );

      case 'navigation':
      case 'select':
        return (
          <View style={styles.navigationRight}>
            {value && typeof value === 'string' && (
              <Text style={styles.valueText}>{value}</Text>
            )}
            <ChevronRight size={20} color={theme.colors.gray[400]} />
          </View>
        );

      case 'info':
        if (value && typeof value === 'string') {
          return <Text style={styles.valueText}>{value}</Text>;
        }
        return null;

      default:
        return null;
    }
  };

  const isInteractive = type !== 'info' && !disabled;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        disabled && styles.disabled,
      ]}
      onPress={handlePress}
      disabled={!isInteractive || type === 'toggle'}
      activeOpacity={isInteractive ? 0.7 : 1}
    >
      <View style={styles.leftContent}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <View style={styles.textContainer}>
          <Text style={[styles.label, disabled && styles.disabledText]}>{label}</Text>
          {description && (
            <Text style={[styles.description, disabled && styles.disabledText]}>
              {description}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.rightContent}>{renderRightContent()}</View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    minHeight: 56,
  },
  disabled: {
    opacity: 0.5,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginRight: theme.spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  description: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: 2,
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.sm,
  },
  disabledText: {
    color: theme.colors.gray[400],
  },
  rightContent: {
    marginLeft: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  navigationRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  valueText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
});
