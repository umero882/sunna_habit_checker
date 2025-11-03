/**
 * Root Navigation
 * Handles main app navigation flow
 */

import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { supabase, onAuthStateChange } from '../services/supabase';
import { checkLocationPermission } from '../services/location';
import { isOnboardingComplete } from '../services/onboarding';
import { theme } from '../constants/theme';

// Import screens
import { WelcomeScreen, SignInScreen, SignUpScreen, ResetPasswordScreen } from '../screens/auth';
import { LocationPermissionScreen } from '../screens/onboarding';
import { MainTabNavigator } from './MainTabNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { QiblaScreen } from '../screens/prayer/QiblaScreen';
import { BackupScreen } from '../screens/profile/BackupScreen';

const Stack = createStackNavigator<RootStackParamList>();

// Loading component
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={theme.colors.primary[600]} />
  </View>
);

export const RootNavigator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [locationPermissionChecked, setLocationPermissionChecked] = useState(false);

  useEffect(() => {
    // Check current auth state
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setIsAuthenticated(!!session);

      // If authenticated, check onboarding and location permission
      if (session) {
        const onboardingComplete = await isOnboardingComplete();
        setHasCompletedOnboarding(onboardingComplete);

        const locationPerm = await checkLocationPermission();
        setHasLocationPermission(locationPerm.granted);
        setLocationPermissionChecked(true);
      }

      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      setIsAuthenticated(!!session);

      // Check onboarding and location permission when user signs in
      if (session) {
        const onboardingComplete = await isOnboardingComplete();
        setHasCompletedOnboarding(onboardingComplete);

        const locationPerm = await checkLocationPermission();
        setHasLocationPermission(locationPerm.granted);
        setLocationPermissionChecked(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Poll for onboarding completion changes every 2 seconds when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || hasCompletedOnboarding) return;

    const interval = setInterval(async () => {
      const onboardingComplete = await isOnboardingComplete();
      if (onboardingComplete) {
        setHasCompletedOnboarding(true);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isAuthenticated, hasCompletedOnboarding]);

  const handleLocationPermissionComplete = async () => {
    const locationPerm = await checkLocationPermission();
    setHasLocationPermission(locationPerm.granted);
  };

  const handleOnboardingComplete = async () => {
    const onboardingComplete = await isOnboardingComplete();
    setHasCompletedOnboarding(onboardingComplete);
  };

  if (isLoading) {
    return (
      <NavigationContainer>
        <LoadingScreen />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!isAuthenticated ? (
          // Auth Stack
          <>
            <Stack.Screen name="Welcome" options={{ headerShown: false }}>
              {(props) => (
                <WelcomeScreen
                  onSignIn={() => props.navigation.navigate('SignIn' as any)}
                  onSignUp={() => props.navigation.navigate('SignUp' as any)}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="SignIn"
              component={SignInScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SignUp"
              component={SignUpScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ResetPassword"
              component={ResetPasswordScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : !hasCompletedOnboarding ? (
          // Onboarding Stack (after authentication, before main app)
          <Stack.Screen name="Onboarding" component={OnboardingNavigator} options={{ headerShown: false }} />
        ) : !hasLocationPermission && locationPermissionChecked ? (
          // Location Permission Screen (legacy, may be removed if included in onboarding)
          <Stack.Screen name="LocationPermission" options={{ headerShown: false }}>
            {(props) => (
              <LocationPermissionScreen
                onComplete={handleLocationPermissionComplete}
                onSkip={handleLocationPermissionComplete}
              />
            )}
          </Stack.Screen>
        ) : (
          // Main App Stack
          <>
            <Stack.Screen
              name="Main"
              component={MainTabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Qibla"
              component={QiblaScreen}
              options={{
                headerShown: true,
                title: 'Qibla Direction',
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="Backup"
              component={BackupScreen}
              options={{
                headerShown: true,
                title: 'Backup & Restore',
                presentation: 'modal',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
  },
});

export default RootNavigator;
