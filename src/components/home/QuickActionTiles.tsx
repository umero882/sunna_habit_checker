/**
 * Quick Action Tiles Component
 * 2x3 grid of quick actions for instant logging
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

export interface QuickActionTile {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}

export interface QuickActionTilesProps {
  tiles?: QuickActionTile[];
  onPrayerLog?: () => void;
  onMorningAdhkar?: () => void;
  onReadQuran?: () => void;
  onSadaqah?: () => void;
  onFasting?: () => void;
  onDhikr?: () => void;
}

const defaultTiles = (props: QuickActionTilesProps): QuickActionTile[] => [
  {
    id: 'prayer-log',
    label: 'Log Prayer',
    icon: 'checkmark-circle-outline',
    color: theme.colors.primary[600],
    onPress: props.onPrayerLog || (() => {}),
  },
  {
    id: 'morning-adhkar',
    label: 'Morning Adhkar',
    icon: 'sunny-outline',
    color: theme.colors.secondary[600],
    onPress: props.onMorningAdhkar || (() => {}),
  },
  {
    id: 'read-quran',
    label: 'Read Quran',
    icon: 'book-outline',
    color: theme.colors.info,
    onPress: props.onReadQuran || (() => {}),
  },
  {
    id: 'sadaqah',
    label: 'Sadaqah',
    icon: 'heart-outline',
    color: theme.colors.success,
    onPress: props.onSadaqah || (() => {}),
  },
  {
    id: 'fasting',
    label: 'Fasting',
    icon: 'moon-outline',
    color: theme.colors.primary[500],
    onPress: props.onFasting || (() => {}),
  },
  {
    id: 'dhikr',
    label: 'Dhikr',
    icon: 'infinite-outline',
    color: theme.colors.secondary[500],
    onPress: props.onDhikr || (() => {}),
  },
];

interface TileItemProps {
  tile: QuickActionTile;
}

const TileItem: React.FC<TileItemProps> = ({ tile }) => (
  <TouchableOpacity
    style={[styles.tile, { borderLeftColor: tile.color }]}
    onPress={tile.onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.iconContainer, { backgroundColor: `${tile.color}15` }]}>
      <Ionicons name={tile.icon} size={24} color={tile.color} />
    </View>
    <Text style={styles.tileLabel}>{tile.label}</Text>
  </TouchableOpacity>
);

export const QuickActionTiles: React.FC<QuickActionTilesProps> = props => {
  const tiles = props.tiles || defaultTiles(props);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quick Actions</Text>
        <Ionicons name="flash-outline" size={18} color={theme.colors.primary[600]} />
      </View>

      <View style={styles.grid}>
        {tiles.map(tile => (
          <TileItem key={tile.id} tile={tile} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  title: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  tile: {
    width: '48%',
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    flex: 1,
  },
});

export default QuickActionTiles;
