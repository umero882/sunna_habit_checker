/**
 * Sunnah Screen
 * Hub for all Sunnah practices with 3-tier benchmarks
 * Features: Today Tab, Library Tab, Benchmarks Tab, Insights Tab
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { theme } from '../constants/theme';
import { TodayTab, LibraryTab, BenchmarksTab, InsightsTab } from '../components/sunnah';

const renderScene = SceneMap({
  today: TodayTab,
  library: LibraryTab,
  benchmarks: BenchmarksTab,
  insights: InsightsTab,
});

export const SunnahScreen: React.FC = () => {
  const layout = useWindowDimensions();

  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'today', title: 'Today' },
    { key: 'library', title: 'Library' },
    { key: 'benchmarks', title: 'Benchmarks' },
    { key: 'insights', title: 'Insights' },
  ]);

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={styles.tabIndicator}
      style={styles.tabBar}
      tabStyle={styles.tab}
      labelStyle={styles.tabLabel}
      activeColor={theme.colors.secondary[600]}
      inactiveColor={theme.colors.text.secondary}
      scrollEnabled
    />
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Sunnah Habits</Text>
        <Text style={styles.subtitle}>Follow the Prophet's way, one step at a time</Text>
      </View>

      {/* Tab Navigation */}
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        renderTabBar={renderTabBar}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  header: {
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },

  // Tab Bar Styles
  tabBar: {
    backgroundColor: theme.colors.background.primary,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  tab: {
    width: 'auto',
    minWidth: 100,
  },
  tabLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    textTransform: 'none',
  },
  tabIndicator: {
    backgroundColor: theme.colors.secondary[600],
    height: 3,
  },
});

export default SunnahScreen;
