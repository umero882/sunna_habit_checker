/**
 * Profile Photo Service
 * Handles uploading, updating, and deleting user profile photos
 */

import * as ImagePicker from 'expo-image-picker';
import { supabase, getCurrentUser } from './supabase';
import { createLogger } from '../utils/logger';
import { decode } from 'base64-arraybuffer';

const logger = createLogger('profilePhotoService');

const AVATAR_BUCKET = 'avatars';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface UploadResult {
  avatarUrl: string;
  publicUrl: string;
}

/**
 * Request camera roll permissions
 */
export const requestMediaLibraryPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      logger.warn('Media library permission denied');
      return false;
    }

    return true;
  } catch (error: any) {
    logger.error('Error requesting media library permissions:', error);
    return false;
  }
};

/**
 * Request camera permissions
 */
export const requestCameraPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      logger.warn('Camera permission denied');
      return false;
    }

    return true;
  } catch (error: any) {
    logger.error('Error requesting camera permissions:', error);
    return false;
  }
};

/**
 * Pick image from gallery
 */
export const pickImageFromGallery = async (): Promise<string | null> => {
  try {
    const hasPermission = await requestMediaLibraryPermissions();

    if (!hasPermission) {
      throw new Error(
        'Permission to access media library was denied. Please enable it in your device settings.'
      );
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1], // Square crop
      quality: 0.8,
    });

    if (result.canceled) {
      logger.info('Image selection cancelled');
      return null;
    }

    return result.assets[0].uri;
  } catch (error: any) {
    logger.error('Error picking image from gallery:', error);
    throw error;
  }
};

/**
 * Take photo with camera
 */
export const takePhoto = async (): Promise<string | null> => {
  try {
    const hasPermission = await requestCameraPermissions();

    if (!hasPermission) {
      throw new Error(
        'Permission to access camera was denied. Please enable it in your device settings.'
      );
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1], // Square crop
      quality: 0.8,
    });

    if (result.canceled) {
      logger.info('Photo capture cancelled');
      return null;
    }

    return result.assets[0].uri;
  } catch (error: any) {
    logger.error('Error taking photo:', error);
    throw error;
  }
};

/**
 * Convert file URI to base64
 */
const uriToBase64 = async (uri: string): Promise<string> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data:image/xxx;base64, prefix
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error: any) {
    logger.error('Error converting URI to base64:', error);
    throw new Error('Failed to read image file');
  }
};

/**
 * Validate image file size
 */
const validateImageSize = (base64: string): void => {
  // Approximate size in bytes (base64 is ~33% larger than original)
  const sizeInBytes = (base64.length * 3) / 4;

  if (sizeInBytes > MAX_FILE_SIZE) {
    throw new Error(`Image is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }

  logger.info(`Image validated: ${(sizeInBytes / 1024).toFixed(2)}KB`);
};

/**
 * Upload profile photo to Supabase Storage
 */
export const uploadProfilePhoto = async (imageUri: string): Promise<UploadResult> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    logger.info(`📤 Starting profile photo upload for user ${user.id}`);

    // Convert image to base64
    const base64 = await uriToBase64(imageUri);

    // Validate image size
    validateImageSize(base64);

    // Determine file extension from URI
    const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${user.id}/avatar_${Date.now()}.${fileExt}`;

    // Determine content type
    const contentType = fileExt === 'png' ? 'image/png' : 'image/jpeg';

    logger.info(`📁 Uploading to: ${AVATAR_BUCKET}/${fileName}`);

    // Delete old avatar if exists
    try {
      const { data: oldFiles } = await supabase.storage.from(AVATAR_BUCKET).list(user.id);

      if (oldFiles && oldFiles.length > 0) {
        const filesToDelete = oldFiles.map(file => `${user.id}/${file.name}`);
        await supabase.storage.from(AVATAR_BUCKET).remove(filesToDelete);
        logger.info(`🗑️ Deleted ${filesToDelete.length} old avatar(s)`);
      }
    } catch (deleteError: any) {
      logger.warn('Could not delete old avatars:', deleteError.message);
      // Continue anyway
    }

    // Upload new avatar using base64
    const { data, error } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(fileName, decode(base64), {
        contentType,
        upsert: true,
      });

    if (error) {
      logger.error('❌ Upload error:', error);
      throw new Error(`Failed to upload photo: ${error.message}`);
    }

    logger.info(`✅ Upload successful: ${data.path}`);

    // Get public URL
    const { data: urlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(data.path);

    const publicUrl = urlData.publicUrl;

    logger.info(`📝 Updating user_profiles table with URL: ${publicUrl}`);

    // First, check if profile row exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (!existingProfile) {
      // Profile doesn't exist, create it
      logger.info(`📝 Profile row doesn't exist, creating one...`);

      const { data: insertData, error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          full_name: user.user_metadata?.name || 'User',
          phone_number: user.user_metadata?.phone || '',
          country: user.user_metadata?.country || '',
          avatar_url: publicUrl,
        })
        .select();

      if (insertError) {
        logger.error('❌ Error creating profile:', insertError);
        throw new Error(`Failed to create profile: ${insertError.message}`);
      }

      logger.info(`✅ Profile created with avatar URL:`, insertData);
    } else {
      // Profile exists, update it
      const { data: updateData, error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id)
        .select();

      if (updateError) {
        logger.error('❌ Error updating profile:', updateError);
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }

      logger.info(`✅ Profile updated with new avatar URL:`, updateData);
    }

    return {
      avatarUrl: data.path,
      publicUrl,
    };
  } catch (error: any) {
    logger.error('Error uploading profile photo:', error);
    throw error;
  }
};

/**
 * Delete profile photo
 */
export const deleteProfilePhoto = async (): Promise<void> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    logger.info(`🗑️ Deleting profile photo for user ${user.id}`);

    // List all files for this user
    const { data: files, error: listError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .list(user.id);

    if (listError) {
      throw new Error(`Failed to list files: ${listError.message}`);
    }

    if (files && files.length > 0) {
      // Delete all avatars
      const filesToDelete = files.map(file => `${user.id}/${file.name}`);
      const { error: deleteError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .remove(filesToDelete);

      if (deleteError) {
        throw new Error(`Failed to delete files: ${deleteError.message}`);
      }

      logger.info(`✅ Deleted ${filesToDelete.length} file(s)`);
    }

    // Remove avatar URL from profile
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ avatar_url: null })
      .eq('user_id', user.id);

    if (updateError) {
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }

    logger.info('✅ Profile avatar removed');
  } catch (error: any) {
    logger.error('Error deleting profile photo:', error);
    throw error;
  }
};

/**
 * Get current profile photo URL
 */
export const getProfilePhotoUrl = async (): Promise<string | null> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('avatar_url')
      .eq('user_id', user.id)
      .single();

    if (error) {
      logger.error('Error getting profile photo URL:', error);
      return null;
    }

    return data?.avatar_url || null;
  } catch (error: any) {
    logger.error('Error getting profile photo URL:', error);
    return null;
  }
};
