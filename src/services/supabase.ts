/**
 * Supabase Client Configuration
 * Handles authentication and database operations
 */

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { SignUpData, UserProfile } from '../types';

import { createLogger } from '../utils/logger';

const logger = createLogger('supabase');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Custom storage adapter for Expo
// Uses SecureStore for sensitive tokens on native with chunking for large values
// Uses AsyncStorage for web
class ExpoSecureStoreAdapter {
  private chunkSize = 2048; // SecureStore limit

  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem(key);
    }

    // Try to get as single item first (for backwards compatibility)
    try {
      const value = await SecureStore.getItemAsync(key);
      if (value) {
        // Check if this is a chunked item
        if (value.startsWith('CHUNKED:')) {
          return this.getChunkedItem(key);
        }
        return value;
      }
    } catch (error) {
      logger.warn(`Error getting ${key} from SecureStore:`, error);
    }

    // Try chunked retrieval
    return this.getChunkedItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      return AsyncStorage.setItem(key, value);
    }

    // If value is small enough, store directly
    if (value.length < this.chunkSize) {
      try {
        return await SecureStore.setItemAsync(key, value);
      } catch (error) {
        logger.error(`Error setting ${key} in SecureStore:`, error);
        throw error;
      }
    }

    // For large values, use chunking
    return this.setChunkedItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      return AsyncStorage.removeItem(key);
    }

    try {
      // Remove main key
      await SecureStore.deleteItemAsync(key);

      // Remove chunks if they exist
      const chunkCount = await SecureStore.getItemAsync(`${key}_chunks`);
      if (chunkCount) {
        const count = parseInt(chunkCount, 10);
        for (let i = 0; i < count; i++) {
          await SecureStore.deleteItemAsync(`${key}_chunk_${i}`);
        }
        await SecureStore.deleteItemAsync(`${key}_chunks`);
      }
    } catch (error) {
      logger.warn(`Error removing ${key} from SecureStore:`, error);
    }
  }

  private async getChunkedItem(key: string): Promise<string | null> {
    try {
      const chunkCountStr = await SecureStore.getItemAsync(`${key}_chunks`);
      if (!chunkCountStr) {
        return null;
      }

      const chunkCount = parseInt(chunkCountStr, 10);
      const chunks: string[] = [];

      for (let i = 0; i < chunkCount; i++) {
        const chunk = await SecureStore.getItemAsync(`${key}_chunk_${i}`);
        if (chunk) {
          chunks.push(chunk);
        }
      }

      return chunks.length > 0 ? chunks.join('') : null;
    } catch (error) {
      logger.error(`Error getting chunked item ${key}:`, error);
      return null;
    }
  }

  private async setChunkedItem(key: string, value: string): Promise<void> {
    try {
      // Split value into chunks
      const chunks: string[] = [];
      for (let i = 0; i < value.length; i += this.chunkSize) {
        chunks.push(value.substring(i, i + this.chunkSize));
      }

      // Store each chunk
      for (let i = 0; i < chunks.length; i++) {
        await SecureStore.setItemAsync(`${key}_chunk_${i}`, chunks[i]);
      }

      // Store chunk count
      await SecureStore.setItemAsync(`${key}_chunks`, chunks.length.toString());

      // Store marker in main key
      await SecureStore.setItemAsync(key, 'CHUNKED:' + chunks.length);
    } catch (error) {
      logger.error(`Error setting chunked item ${key}:`, error);
      throw error;
    }
  }
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: new ExpoSecureStoreAdapter(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Important for mobile
  },
});

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== '' && supabaseAnonKey !== '');
};

// Helper to get current user
export const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

// Sign in with email
export const signIn = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
};

// Alias for backwards compatibility
export const signInWithEmail = signIn;

// Sign up with email and create user profile
export const signUp = async (signUpData: SignUpData) => {
  const { email, password, fullName, phoneNumber, country } = signUpData;

  // Step 1: Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    return { data: null, error: authError };
  }

  if (!authData.user) {
    return {
      data: null,
      error: new Error('User creation failed - no user returned'),
    };
  }

  // Step 2: Create user profile
  try {
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: authData.user.id,
        full_name: fullName,
        phone_number: phoneNumber,
        country: country,
      })
      .select()
      .single();

    if (profileError) {
      // If profile creation fails, we still return the auth data
      // The user can still use the app, but we log the error
      logger.error('Profile creation error:', profileError);
      return {
        data: authData,
        error: new Error('Account created but profile setup failed. Please contact support.'),
      };
    }

    return { data: authData, error: null };
  } catch (error) {
    logger.error('Unexpected error during profile creation:', error);
    return {
      data: authData,
      error: new Error('Account created but profile setup failed. Please contact support.'),
    };
  }
};

// Alias for backwards compatibility (old signature)
export const signUpWithEmail = async (email: string, password: string) => {
  return await supabase.auth.signUp({
    email,
    password,
  });
};

// Sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Reset password
export const resetPassword = async (email: string) => {
  return await supabase.auth.resetPasswordForEmail(email);
};

// Subscribe to auth state changes
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};

// Get user profile
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    logger.error('Error fetching user profile:', error);
    return null;
  }

  return data;
};

// Update user profile
export const updateUserProfile = async (
  userId: string,
  updates: Partial<Omit<UserProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
) => {
  return await supabase
    .from('user_profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();
};
