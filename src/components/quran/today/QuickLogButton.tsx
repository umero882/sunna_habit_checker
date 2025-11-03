/**
 * QuickLogButton Component
 * Quick action button to manually log reading progress
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { theme } from '../../../constants/theme';
import { useReadingPlan } from '../../../hooks/useReadingPlan';
import { SURAHS } from '../../../constants/quran';

import { createLogger } from '../../../utils/logger';

const logger = createLogger('QuickLogButton');

interface QuickLogButtonProps {
  userId: string;
  onLogComplete?: () => void;
}

export const QuickLogButton: React.FC<QuickLogButtonProps> = ({ userId, onLogComplete }) => {
  const { logReading, activePlan } = useReadingPlan(userId);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    surahNumber: 1,
    fromAyah: '1',
    toAyah: '1',
    pagesRead: '',
    durationMinutes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenModal = () => {
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      surahNumber: 1,
      fromAyah: '1',
      toAyah: '1',
      pagesRead: '',
      durationMinutes: '',
    });
  };

  const handleSubmit = async () => {
    // Convert strings to numbers for validation
    const fromAyahNum = parseInt(formData.fromAyah) || 1;
    const toAyahNum = parseInt(formData.toAyah) || 1;

    // Validation
    if (fromAyahNum > toAyahNum) {
      Alert.alert('Invalid Range', 'From Ayah must be less than or equal to To Ayah');
      return;
    }

    const selectedSurah = SURAHS.find((s) => s.number === formData.surahNumber);
    if (!selectedSurah) {
      Alert.alert('Error', 'Invalid Surah selected');
      return;
    }

    if (toAyahNum > selectedSurah.numberOfAyahs) {
      Alert.alert(
        'Invalid Ayah',
        `${selectedSurah.name} has only ${selectedSurah.numberOfAyahs} verses`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await logReading({
        surah_number: formData.surahNumber,
        from_ayah: fromAyahNum,
        to_ayah: toAyahNum,
        pages_read: formData.pagesRead ? parseFloat(formData.pagesRead) : undefined,
        duration_minutes: formData.durationMinutes
          ? parseInt(formData.durationMinutes)
          : undefined,
      });

      Alert.alert('Success', 'Reading logged successfully!');
      handleCloseModal();
      onLogComplete?.();
    } catch (error) {
      logger.error('Error logging reading:', error);
      Alert.alert('Error', 'Failed to log reading. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectedSurah = () => {
    return SURAHS.find((s) => s.number === formData.surahNumber);
  };

  return (
    <>
      {/* Quick Log Button */}
      <TouchableOpacity
        style={styles.quickLogButton}
        onPress={handleOpenModal}
        activeOpacity={0.7}
      >
        <Text style={styles.quickLogIcon}>+</Text>
        <Text style={styles.quickLogText}>Log Reading</Text>
      </TouchableOpacity>

      {/* Log Reading Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Log Reading Session</Text>
                <TouchableOpacity onPress={handleCloseModal}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Surah Selector */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Surah</Text>
                <View style={styles.surahSelector}>
                  <TouchableOpacity
                    style={styles.selectorButton}
                    onPress={() =>
                      setFormData((prev) => ({
                        ...prev,
                        surahNumber: Math.max(1, prev.surahNumber - 1),
                      }))
                    }
                  >
                    <Text style={styles.selectorButtonText}>−</Text>
                  </TouchableOpacity>

                  <View style={styles.selectorDisplay}>
                    <Text style={styles.selectorNumber}>{formData.surahNumber}</Text>
                    <Text style={styles.selectorName}>{getSelectedSurah()?.name}</Text>
                    <Text style={styles.selectorNameArabic}>{getSelectedSurah()?.nameArabic}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.selectorButton}
                    onPress={() =>
                      setFormData((prev) => ({
                        ...prev,
                        surahNumber: Math.min(114, prev.surahNumber + 1),
                      }))
                    }
                  >
                    <Text style={styles.selectorButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Ayah Range */}
              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.label}>From Ayah</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.fromAyah}
                    onChangeText={(text) =>
                      setFormData((prev) => ({
                        ...prev,
                        fromAyah: text.replace(/[^0-9]/g, ''), // Only allow digits
                      }))
                    }
                    keyboardType="number-pad"
                    placeholder="1"
                  />
                </View>

                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.label}>To Ayah</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.toAyah}
                    onChangeText={(text) =>
                      setFormData((prev) => ({
                        ...prev,
                        toAyah: text.replace(/[^0-9]/g, ''), // Only allow digits
                      }))
                    }
                    keyboardType="number-pad"
                    placeholder="1"
                  />
                </View>
              </View>

              {/* Optional Fields */}
              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.label}>
                    Pages Read{' '}
                    <Text style={styles.optionalLabel}>(optional)</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={formData.pagesRead}
                    onChangeText={(text) =>
                      setFormData((prev) => ({ ...prev, pagesRead: text }))
                    }
                    keyboardType="decimal-pad"
                    placeholder="0.5"
                  />
                </View>

                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.label}>
                    Duration{' '}
                    <Text style={styles.optionalLabel}>(min)</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={formData.durationMinutes}
                    onChangeText={(text) =>
                      setFormData((prev) => ({ ...prev, durationMinutes: text }))
                    }
                    keyboardType="number-pad"
                    placeholder="15"
                  />
                </View>
              </View>

              {/* Info Card */}
              {activePlan && (
                <View style={styles.infoCard}>
                  <Text style={styles.infoText}>
                    Active Plan: {activePlan.name}
                  </Text>
                  <Text style={styles.infoSubtext}>
                    This reading will count toward your plan progress
                  </Text>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.7}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Logging...' : 'Log Reading'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  quickLogButton: {
    backgroundColor: theme.colors.secondary[500],
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
    minHeight: 48,
  },
  quickLogIcon: {
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.text.inverse,
    marginRight: theme.spacing.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  quickLogText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
  },
  modalOverlay: {
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  closeButton: {
    fontSize: theme.typography.fontSize.xxl,
    color: theme.colors.text.secondary,
    padding: theme.spacing.sm,
  },
  formGroup: {
    marginBottom: theme.spacing.lg,
  },
  formRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  formGroupHalf: {
    flex: 1,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  optionalLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.regular,
  },
  input: {
    ...theme.components.input,
  },
  surahSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  selectorButton: {
    width: 40,
    height: 40,
    backgroundColor: theme.colors.primary[600],
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorButtonText: {
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.text.inverse,
    fontWeight: theme.typography.fontWeight.bold,
  },
  selectorDisplay: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  selectorNumber: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[700],
    marginBottom: theme.spacing.xs,
  },
  selectorName: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  selectorNameArabic: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  infoCard: {
    backgroundColor: theme.colors.primary[50],
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary[600],
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
  },
  infoText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  infoSubtext: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  submitButton: {
    ...theme.components.button.primary,
    marginTop: theme.spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
    textAlign: 'center',
  },
});

export default QuickLogButton;
