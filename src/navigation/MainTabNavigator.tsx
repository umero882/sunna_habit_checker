/**
 * Main Tab Navigator
 * Bottom tab navigation with 8 tabs for primary app features
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MainTabParamList } from '../types';
import { theme } from '../constants/theme';
import { HeaderLogoutButton } from '../components/common';

// Import placeholder screens
import { HomeScreen } from '../screens/HomeScreen';
import { PrayersScreen } from '../screens/PrayersScreen';
import { SunnahScreen } from '../screens/SunnahScreen';
import { QuranScreen } from '../screens/QuranScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Custom color scheme for each tab
const tabColors = {
  home: { active: '#10B981', inactive: '#6EE7B7' },      // Green - Growth & Life
  prayers: { active: '#3B82F6', inactive: '#93C5FD' },   // Blue - Sky & Spirituality
  sunnah: { active: '#F59E0B', inactive: '#FCD34D' },    // Amber - Light & Guidance
  quran: { active: '#8B5CF6', inactive: '#C4B5FD' },     // Purple - Wisdom & Nobility
  profile: { active: '#6B7280', inactive: '#D1D5DB' },   // Gray - Simplicity & Balance
};

export const MainTabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary[600],
        tabBarInactiveTintColor: theme.colors.gray[400],
        tabBarStyle: {
          backgroundColor: theme.colors.background.primary,
          borderTopColor: theme.colors.border.light,
          borderTopWidth: 1,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 10,
          height: insets.bottom > 0 ? 65 + insets.bottom : 75,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: theme.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeight.semibold,
          marginTop: 4,
          marginBottom: 2,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor: theme.colors.background.primary,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border.light,
        },
        headerTitleStyle: {
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
        },
        headerRight: () => <HeaderLogoutButton />,
      }}
    >
      {/* 1. Home - Dashboard & quick actions */}
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarActiveTintColor: tabColors.home.active,
          tabBarInactiveTintColor: tabColors.home.inactive,
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={26}
              color={focused ? tabColors.home.active : tabColors.home.inactive}
            />
          ),
        }}
      />

      {/* 2. Prayers - Prayer times & tracker */}
      <Tab.Screen
        name="PrayersTab"
        component={PrayersScreen}
        options={{
          title: 'Prayers',
          tabBarLabel: 'Prayers',
          tabBarActiveTintColor: tabColors.prayers.active,
          tabBarInactiveTintColor: tabColors.prayers.inactive,
          tabBarIcon: ({ focused }) => (
            <FontAwesome5
              name="mosque"
              size={24}
              color={focused ? tabColors.prayers.active : tabColors.prayers.inactive}
            />
          ),
        }}
      />

      {/* 3. Sunnah - Daily habits & Benchmarks */}
      <Tab.Screen
        name="SunnahTab"
        component={SunnahScreen}
        options={{
          title: 'Sunnah',
          tabBarLabel: 'Sunnah',
          tabBarActiveTintColor: tabColors.sunnah.active,
          tabBarInactiveTintColor: tabColors.sunnah.inactive,
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "sunny" : "sunny-outline"}
              size={26}
              color={focused ? tabColors.sunnah.active : tabColors.sunnah.inactive}
            />
          ),
        }}
      />

      {/* 4. Qur'an - Reading, Hadith & reflection */}
      <Tab.Screen
        name="QuranTab"
        component={QuranScreen}
        options={{
          title: "Qur'an",
          tabBarLabel: "Qur'an",
          tabBarActiveTintColor: tabColors.quran.active,
          tabBarInactiveTintColor: tabColors.quran.inactive,
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "book" : "book-outline"}
              size={26}
              color={focused ? tabColors.quran.active : tabColors.quran.inactive}
            />
          ),
        }}
      />

      {/* 5. Profile - Settings, reminders, progress */}
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarActiveTintColor: tabColors.profile.active,
          tabBarInactiveTintColor: tabColors.profile.inactive,
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={26}
              color={focused ? tabColors.profile.active : tabColors.profile.inactive}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
