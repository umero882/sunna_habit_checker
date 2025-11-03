/**
 * CreatePlanModal Component
 * Modal for creating a new reading plan
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../../../constants/theme';
import { ReadingMode } from '../../../types';
import { useQuranPreferences } from '../../../hooks/useQuranPreferences';

import { createLogger } from '../../../utils/logger';

const logger = createLogger('CreatePlanModal');

interface CreatePlanModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (plan: {
    name: string;
    mode: ReadingMode;
    target_per_day: number;
    total_target?: number;
    active: boolean;
  }) => Promise<void>;
}

const PRESET_PLANS = [
  {
    name: 'Complete Quran in 30 Days',
    mode: 'pages' as ReadingMode,
    target_per_day: 20,
    total_target: 604,
  },
  {
    name: 'Complete Quran in 60 Days',
    mode: 'pages' as ReadingMode,
    target_per_day: 10,
    total_target: 604,
  },
  {
    name: 'One Juz Per Day',
    mode: 'pages' as ReadingMode,
    target_per_day: 20,
    total_target: 604,
  },
  {
    name: 'Daily 5 Pages',
    mode: 'pages' as ReadingMode,
    target_per_day: 5,
    total_target: undefined,
  },
  {
    name: '15 Minutes Daily',
    mode: 'time' as ReadingMode,
    target_per_day: 15,
    total_target: undefined,
  },
];

export const CreatePlanModal: React.FC<CreatePlanModalProps> = ({ visible, onClose, onCreate }) => {
  const { preferences } = useQuranPreferences();
  const [step, setStep] = useState<'preset' | 'custom'>('preset');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedPresetIndex, setSuggestedPresetIndex] = useState<number | null>(null);

  // Custom plan state
  const [planName, setPlanName] = useState('');
  const [mode, setMode] = useState<ReadingMode>('pages');
  const [targetPerDay, setTargetPerDay] = useState('');
  const [totalTarget, setTotalTarget] = useState('');
  const [hasEndDate, setHasEndDate] = useState(false);

  // Load user's onboarding daily goal and suggest matching preset
  useEffect(() => {
    if (preferences?.dailyGoalValue && preferences?.dailyGoalMode === 'pages') {
      const goalValue = preferences.dailyGoalValue;

      // Find matching preset based on daily goal
      const matchingIndex = PRESET_PLANS.findIndex(
        plan => plan.mode === 'pages' && plan.target_per_day === goalValue
      );

      if (matchingIndex !== -1) {
        setSuggestedPresetIndex(matchingIndex);
      } else {
        // If no exact match, pre-fill custom plan
        setTargetPerDay(goalValue.toString());
        setMode('pages');
      }
    }
  }, [preferences]);

  const resetForm = () => {
    setPlanName('');
    setMode('pages');
    setTargetPerDay('');
    setTotalTarget('');
    setHasEndDate(false);
    setStep('preset');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCreatePreset = async (preset: (typeof PRESET_PLANS)[0]) => {
    setIsLoading(true);
    try {
      await onCreate({
        name: preset.name,
        mode: preset.mode,
        target_per_day: preset.target_per_day,
        total_target: preset.total_target,
        active: true,
      });
      handleClose();
    } catch (error) {
      logger.error('Failed to create preset plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCustom = async () => {
    if (!planName.trim() || !targetPerDay) return;

    setIsLoading(true);
    try {
      await onCreate({
        name: planName.trim(),
        mode,
        target_per_day: parseInt(targetPerDay),
        total_target: hasEndDate && totalTarget ? parseInt(totalTarget) : undefined,
        active: true,
      });
      handleClose();
    } catch (error) {
      logger.error('Failed to create custom plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getModeLabel = (m: ReadingMode): string => {
    switch (m) {
      case 'pages':
        return 'Pages';
      case 'verses':
        return 'Verses';
      case 'time':
        return 'Minutes';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Reading Plan</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {step === 'preset' ? (
              <>
                {/* Preset Plans */}
                <Text style={styles.sectionTitle}>Choose a Preset Plan</Text>
                {suggestedPresetIndex !== null && (
                  <View style={styles.suggestionBanner}>
                    <Text style={styles.suggestionText}>✨ Based on your goal from onboarding</Text>
                  </View>
                )}
                {PRESET_PLANS.map((preset, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.presetCard,
                      suggestedPresetIndex === index && styles.presetCardSuggested,
                    ]}
                    onPress={() => handleCreatePreset(preset)}
                    disabled={isLoading}
                  >
                    <View style={styles.presetContent}>
                      <View style={styles.presetHeader}>
                        <Text style={styles.presetName}>{preset.name}</Text>
                        {suggestedPresetIndex === index && (
                          <View style={styles.suggestedBadge}>
                            <Text style={styles.suggestedBadgeText}>Recommended</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.presetDetails}>
                        {preset.target_per_day} {getModeLabel(preset.mode)}/day
                        {preset.total_target && ` • Goal: ${preset.total_target}`}
                      </Text>
                    </View>
                    <Text style={styles.presetArrow}>→</Text>
                  </TouchableOpacity>
                ))}

                {/* Custom Plan Button */}
                <TouchableOpacity
                  style={styles.customButton}
                  onPress={() => setStep('custom')}
                  disabled={isLoading}
                >
                  <Text style={styles.customButtonText}>+ Create Custom Plan</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Custom Plan Form */}
                <TouchableOpacity style={styles.backButton} onPress={() => setStep('preset')}>
                  <Text style={styles.backIcon}>←</Text>
                  <Text style={styles.backText}>Back to Presets</Text>
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>Custom Plan</Text>

                {/* Plan Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Plan Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., My Reading Goal"
                    value={planName}
                    onChangeText={setPlanName}
                    placeholderTextColor={theme.colors.text.tertiary}
                  />
                </View>

                {/* Mode Selection */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Reading Mode</Text>
                  <View style={styles.modeSelector}>
                    {(['pages', 'verses', 'time'] as ReadingMode[]).map(m => (
                      <TouchableOpacity
                        key={m}
                        style={[styles.modeOption, mode === m && styles.modeOptionActive]}
                        onPress={() => setMode(m)}
                      >
                        <Text style={[styles.modeText, mode === m && styles.modeTextActive]}>
                          {getModeLabel(m)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Daily Target */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Daily Target ({getModeLabel(mode)})</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 5"
                    keyboardType="numeric"
                    value={targetPerDay}
                    onChangeText={setTargetPerDay}
                    placeholderTextColor={theme.colors.text.tertiary}
                  />
                </View>

                {/* Has End Goal Toggle */}
                <TouchableOpacity
                  style={styles.toggleRow}
                  onPress={() => setHasEndDate(!hasEndDate)}
                >
                  <Text style={styles.toggleLabel}>Set a completion goal?</Text>
                  <View style={[styles.toggle, hasEndDate && styles.toggleActive]}>
                    <View style={[styles.toggleThumb, hasEndDate && styles.toggleThumbActive]} />
                  </View>
                </TouchableOpacity>

                {/* Total Target (if has end goal) */}
                {hasEndDate && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Total Goal ({getModeLabel(mode)})</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., 604 (full Quran)"
                      keyboardType="numeric"
                      value={totalTarget}
                      onChangeText={setTotalTarget}
                      placeholderTextColor={theme.colors.text.tertiary}
                    />
                  </View>
                )}

                {/* Create Button */}
                <TouchableOpacity
                  style={[
                    styles.createButton,
                    (!planName.trim() || !targetPerDay) && styles.createButtonDisabled,
                  ]}
                  onPress={handleCreateCustom}
                  disabled={!planName.trim() || !targetPerDay || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={theme.colors.text.inverse} />
                  ) : (
                    <Text style={styles.createButtonText}>Create Plan</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: theme.colors.background.primary,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  closeIcon: {
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.text.tertiary,
  },
  content: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  suggestionBanner: {
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary[600],
  },
  suggestionText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary[700],
    fontWeight: theme.typography.fontWeight.medium,
  },
  presetCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetCardSuggested: {
    borderColor: theme.colors.primary[600],
    backgroundColor: theme.colors.primary[50],
  },
  presetContent: {
    flex: 1,
  },
  presetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: 4,
  },
  presetName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  suggestedBadge: {
    backgroundColor: theme.colors.primary[600],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  suggestedBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeight.bold,
  },
  presetDetails: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  presetArrow: {
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.text.tertiary,
    marginLeft: theme.spacing.md,
  },
  customButton: {
    backgroundColor: theme.colors.primary[600],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  customButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  backIcon: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.primary[600],
    marginRight: theme.spacing.sm,
  },
  backText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.primary[600],
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
  },
  modeSelector: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  modeOption: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeOptionActive: {
    borderColor: theme.colors.primary[600],
    backgroundColor: theme.colors.primary[50],
  },
  modeText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  modeTextActive: {
    color: theme.colors.primary[700],
    fontWeight: theme.typography.fontWeight.bold,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  toggleLabel: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.gray[300],
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: theme.colors.primary[600],
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.background.primary,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  createButton: {
    backgroundColor: theme.colors.primary[600],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  createButtonDisabled: {
    backgroundColor: theme.colors.gray[300],
  },
  createButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
  },
});

export default CreatePlanModal;
