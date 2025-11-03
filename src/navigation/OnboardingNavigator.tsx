/**
 * Onboarding Navigator
 * Stack navigation for onboarding flow
 */

import React from 'react';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import type { OnboardingStackParamList } from '../types';

// Import onboarding screens (placeholders until we create them)
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import FeaturesPrayerScreen from '../screens/onboarding/FeaturesPrayerScreen';
import FeaturesQuranScreen from '../screens/onboarding/FeaturesQuranScreen';
import FeaturesSunnahScreen from '../screens/onboarding/FeaturesSunnahScreen';
import PermissionsScreen from '../screens/onboarding/PermissionsScreen';
import PrayerSettingsScreen from '../screens/onboarding/PrayerSettingsScreen';
import QuranPreferencesScreen from '../screens/onboarding/QuranPreferencesScreen';
import CompletionScreen from '../screens/onboarding/CompletionScreen';

const Stack = createStackNavigator<OnboardingStackParamList>();

export const OnboardingNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // Prevent swipe back to enforce flow
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="FeaturesPrayer" component={FeaturesPrayerScreen} />
      <Stack.Screen name="FeaturesQuran" component={FeaturesQuranScreen} />
      <Stack.Screen name="FeaturesSunnah" component={FeaturesSunnahScreen} />
      <Stack.Screen name="Permissions" component={PermissionsScreen} />
      <Stack.Screen name="PrayerSettings" component={PrayerSettingsScreen} />
      <Stack.Screen name="QuranPreferences" component={QuranPreferencesScreen} />
      <Stack.Screen name="Complete" component={CompletionScreen} />
    </Stack.Navigator>
  );
};

export default OnboardingNavigator;
