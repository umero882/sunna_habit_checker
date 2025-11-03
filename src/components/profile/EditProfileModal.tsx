/**
 * EditProfileModal Component
 * Modal for editing user profile information (name, phone, email)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { X, User, Phone, Mail, Camera, Image as ImageIcon, Trash2 } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { theme } from '../../constants/theme';
import { supabase } from '../../services/supabase';
import {
  pickImageFromGallery,
  takePhoto,
  uploadProfilePhoto,
  deleteProfilePhoto,
} from '../../services/profilePhotoService';

import { createLogger } from '../../utils/logger';

const logger = createLogger('EditProfileModal');

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  currentName?: string;
  currentPhone?: string;
  currentEmail?: string;
  currentAvatarUrl?: string;
  onSuccess?: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  currentName = '',
  currentPhone = '',
  currentEmail = '',
  currentAvatarUrl = '',
  onSuccess,
}) => {
  const [name, setName] = useState(currentName);
  const [phone, setPhone] = useState(currentPhone);
  const [email, setEmail] = useState(currentEmail);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const queryClient = useQueryClient();

  // Update form when props change
  useEffect(() => {
    setName(currentName);
    setPhone(currentPhone);
    setEmail(currentEmail);
    setAvatarUrl(currentAvatarUrl);
  }, [currentName, currentPhone, currentEmail, currentAvatarUrl, visible]);

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter your name');
      return;
    }

    if (email && !isValidEmail(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return;
    }

    if (phone && !isValidPhone(phone)) {
      Alert.alert('Validation Error', 'Please enter a valid phone number');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('Not authenticated');
      }

      // Update user metadata (name and phone)
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          name: name.trim(),
          phone: phone.trim() || null,
        },
      });

      if (metadataError) throw metadataError;

      // If email changed, update email (requires re-authentication)
      if (email !== currentEmail && email.trim()) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email.trim(),
        });

        if (emailError) {
          // Show warning but don't fail the whole update
          Alert.alert(
            'Email Update',
            'Name and phone updated successfully, but email update requires verification. Please check your inbox.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Success',
            'Profile updated successfully! Please verify your new email if you changed it.',
            [{ text: 'OK' }]
          );
        }
      } else {
        Alert.alert('Success', 'Profile updated successfully!', [{ text: 'OK' }]);
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      logger.error('Error updating profile:', error);
      Alert.alert(
        'Update Failed',
        error.message || 'Failed to update profile. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone: string): boolean => {
    // Allow digits, spaces, +, -, (, )
    const phoneRegex = /^[\d\s+\-()]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  };

  const handlePhotoOptionPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library', avatarUrl ? 'Remove Photo' : ''].filter(Boolean),
          destructiveButtonIndex: avatarUrl ? 3 : undefined,
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            await handleTakePhoto();
          } else if (buttonIndex === 2) {
            await handlePickFromGallery();
          } else if (buttonIndex === 3 && avatarUrl) {
            await handleDeletePhoto();
          }
        }
      );
    } else {
      // Android - show custom alert
      Alert.alert(
        'Profile Photo',
        'Choose an option',
        [
          { text: 'Take Photo', onPress: handleTakePhoto },
          { text: 'Choose from Library', onPress: handlePickFromGallery },
          ...(avatarUrl ? [{ text: 'Remove Photo', onPress: handleDeletePhoto, style: 'destructive' as const }] : []),
          { text: 'Cancel', style: 'cancel' as const },
        ]
      );
    }
  };

  const handleTakePhoto = async () => {
    try {
      setIsUploadingPhoto(true);
      const photoUri = await takePhoto();

      if (photoUri) {
        const result = await uploadProfilePhoto(photoUri);
        setAvatarUrl(result.publicUrl);

        // Invalidate profile cache to refetch with new photo
        await queryClient.invalidateQueries({ queryKey: ['userProfile'] });

        Alert.alert('Success', 'Profile photo updated!');
      }
    } catch (error: any) {
      logger.error('Error taking photo:', error);
      Alert.alert('Error', error.message || 'Failed to take photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handlePickFromGallery = async () => {
    try {
      setIsUploadingPhoto(true);
      const photoUri = await pickImageFromGallery();

      if (photoUri) {
        const result = await uploadProfilePhoto(photoUri);
        setAvatarUrl(result.publicUrl);

        // Invalidate profile cache to refetch with new photo
        await queryClient.invalidateQueries({ queryKey: ['userProfile'] });

        Alert.alert('Success', 'Profile photo updated!');
      }
    } catch (error: any) {
      logger.error('Error picking photo:', error);
      Alert.alert('Error', error.message || 'Failed to select photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    try {
      setIsUploadingPhoto(true);
      await deleteProfilePhoto();
      setAvatarUrl('');

      // Invalidate profile cache to refetch without photo
      await queryClient.invalidateQueries({ queryKey: ['userProfile'] });

      Alert.alert('Success', 'Profile photo removed');
    } catch (error: any) {
      logger.error('Error deleting photo:', error);
      Alert.alert('Error', error.message || 'Failed to remove photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const getUserInitials = (): string => {
    if (!name) return '?';
    const nameParts = name.trim().split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Edit Profile</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Profile Photo Section */}
            <View style={styles.photoSection}>
              <View style={styles.avatarWrapper}>
                <TouchableOpacity
                  style={styles.avatarTouchable}
                  onPress={handlePhotoOptionPress}
                  disabled={isUploadingPhoto}
                >
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarPlaceholderText}>{getUserInitials()}</Text>
                    </View>
                  )}
                  {isUploadingPhoto && (
                    <View style={styles.uploadingOverlay}>
                      <ActivityIndicator size="large" color={theme.colors.primary[600]} />
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cameraButton}
                  onPress={handlePhotoOptionPress}
                  disabled={isUploadingPhoto}
                >
                  <Camera size={18} color={theme.colors.background.primary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.photoHint}>Tap to change profile photo</Text>
            </View>

            {/* Name Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                <User size={16} color={theme.colors.text.secondary} /> Full Name *
              </Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor={theme.colors.text.tertiary}
                autoCapitalize="words"
              />
            </View>

            {/* Phone Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                <Phone size={16} color={theme.colors.text.secondary} /> Phone Number
              </Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+1 (555) 123-4567"
                placeholderTextColor={theme.colors.text.tertiary}
                keyboardType="phone-pad"
              />
              <Text style={styles.hint}>Optional - for account recovery</Text>
            </View>

            {/* Email Field */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                <Mail size={16} color={theme.colors.text.secondary} /> Email Address
              </Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your.email@example.com"
                placeholderTextColor={theme.colors.text.tertiary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Text style={styles.hint}>Changing email requires verification</Text>
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                ℹ️ Your information is private and secure. We only use it for account management
                and recovery purposes.
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={theme.colors.text.inverse} />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme.colors.background.primary,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  formGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    ...theme.components.input,
    fontSize: theme.typography.fontSize.md,
  },
  hint: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.xs,
    fontStyle: 'italic',
  },
  infoBox: {
    backgroundColor: theme.colors.primary[50],
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary[600],
    marginBottom: theme.spacing.lg,
  },
  infoText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary[700],
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.sm,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  cancelButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
  },
  saveButton: {
    backgroundColor: theme.colors.primary[600],
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: theme.spacing.sm,
  },
  avatarTouchable: {
    position: 'relative',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: theme.colors.primary[600],
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primary[100],
    borderWidth: 3,
    borderColor: theme.colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 40,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[700],
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.colors.background.primary,
    ...theme.shadows.md,
  },
  photoHint: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
  },
});

export default EditProfileModal;
