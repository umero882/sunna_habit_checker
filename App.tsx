/**
 * Sunnah Habit Checker - Main App Entry Point
 * A React Native app to help Muslims build consistent daily Sunnah habits
 */

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { LogBox } from 'react-native';

// Suppress known warnings
LogBox.ignoreLogs([
  'VirtualizedLists should never be nested', // Victory charts in ScrollView + QuranReader FlatList
  'expo-notifications: Android Push notifications', // Push notifications don't work in Expo Go (SDK 53+), but work in production builds
]);

// Additional warning suppression for console errors
if (__DEV__) {
  const originalError = console.error;
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('VirtualizedLists should never be nested')
    ) {
      return; // Suppress this specific error
    }
    originalError(...args);
  };
}

// Services
import i18n from './src/services/i18n';
import { isSupabaseConfigured } from './src/services/supabase';
import { quranDb } from './src/services/quranDb';
import { createLogger } from './src/utils/logger';

// Navigation
import RootNavigator from './src/navigation/RootNavigator';

// Error Boundary
import ErrorBoundary from './src/components/common/ErrorBoundary';

const logger = createLogger('App');

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize app
    const initializeApp = async () => {
      try {
        // Check if Supabase is configured
        if (!isSupabaseConfigured()) {
          console.warn(
            '⚠️ Supabase is not configured. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file'
          );
        }

        // Initialize Quran database
        logger.info('Initializing Quran database...');
        await quranDb.init();
        logger.info('Quran database initialized successfully');

        // Add any other initialization logic here
        // - Load persisted settings
        // - Initialize notifications
        // - etc.

        setIsReady(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsReady(true); // Still set ready to show error screen
      }
    };

    initializeApp();
  }, []);

  if (!isReady) {
    // You can show a splash screen here
    return null;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <I18nextProvider i18n={i18n}>
            <StatusBar style="auto" />
            <RootNavigator />
          </I18nextProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
