/**
 * Prayer Card Component
 * Displays a single prayer with time and logging options
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { theme } from '../../constants/theme';
import type { PrayerName, PrayerStatus } from '../../types';
import { isJumuahPrayer } from '../../utils/dateHelpers';
import { getRandomHadithByStatus, getHadithByStatus } from '../../constants/hadith';
import { FridaySunnahChecklist } from './FridaySunnahChecklist';
import { PrayerStatusHadith } from './PrayerStatusHadith';
import { RewardAnimationModal } from './RewardAnimationModal';

import { createLogger } from '../../utils/logger';

const logger = createLogger('PrayerCard');

interface PrayerCardProps {
  prayer: PrayerName;
  time: string;
  status?: PrayerStatus;
  jamaah?: boolean;
  onLog: (status: PrayerStatus, jamaah?: boolean, fridaySunnah?: string[]) => void;
  disabled?: boolean;
}

export const PrayerCard: React.FC<PrayerCardProps> = ({
  prayer,
  time,
  status,
  jamaah,
  onLog,
  disabled = false,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showJamaahModal, setShowJamaahModal] = useState(false);
  const [showFridaySunnahModal, setShowFridaySunnahModal] = useState(false);
  const [showHadithModal, setShowHadithModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<PrayerStatus | null>(null);
  const [selectedJamaah, setSelectedJamaah] = useState<boolean | null>(null);
  const [displayedHadith, setDisplayedHadith] = useState<any>(null);
  const [displayedStatus, setDisplayedStatus] = useState<PrayerStatus | null>(null);
  const [currentHadithIndex, setCurrentHadithIndex] = useState(0);
  const [allHadiths, setAllHadiths] = useState<any[]>([]);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardIsJamaah, setRewardIsJamaah] = useState(false);

  const getStatusColor = (status?: PrayerStatus) => {
    if (!status) return theme.colors.gray[300];

    switch (status) {
      case 'on_time':
        return theme.colors.onTime;
      case 'delayed':
        return theme.colors.delayed;
      case 'missed':
        return theme.colors.missed;
      case 'qadaa':
        return theme.colors.qadaa;
      default:
        return theme.colors.gray[300];
    }
  };

  const getStatusLabel = (status?: PrayerStatus) => {
    if (!status) return 'Not logged';

    switch (status) {
      case 'on_time':
        return 'On Time';
      case 'delayed':
        return 'Delayed';
      case 'missed':
        return 'Missed';
      case 'qadaa':
        return 'Qadaa';
      default:
        return 'Not logged';
    }
  };

  const handleStatusSelect = (status: PrayerStatus) => {
    setSelectedStatus(status);
    setShowModal(false);

    if (status === 'on_time') {
      // Show Jamaah modal for on-time prayers
      setShowJamaahModal(true);
    } else {
      // For other statuses (delayed, missed, qadaa), log directly and show hadith
      onLog(status);

      // Get all hadith for this status
      const hadiths = getHadithByStatus(status);
      if (hadiths && hadiths.length > 0) {
        setAllHadiths(hadiths);
        setCurrentHadithIndex(0);
        setDisplayedHadith(hadiths[0]);
        setDisplayedStatus(status);
        setShowHadithModal(true);
      }

      // Reset selection state
      setSelectedStatus(null);
    }
  };

  const handleJamaahSelect = (inJamaah: boolean) => {
    setSelectedJamaah(inJamaah);
    setShowJamaahModal(false);

    // Show reward animation first
    setRewardIsJamaah(inJamaah);
    setShowRewardModal(true);
  };

  const handleRewardAnimationComplete = () => {
    setShowRewardModal(false);

    // Check if it's Friday Jumu'ah prayer with Jamaah
    if (selectedStatus === 'on_time' && selectedJamaah && isJumuahPrayer(prayer)) {
      // Show Friday Sunnah checklist for Jumu'ah
      setShowFridaySunnahModal(true);
    } else {
      // Complete logging without Friday Sunnah - pass selectedJamaah directly
      completePrayerLog(undefined, selectedJamaah !== null ? selectedJamaah : undefined);
    }
  };

  const handleFridaySunnahComplete = (completedItems: string[]) => {
    setShowFridaySunnahModal(false);
    completePrayerLog(completedItems, selectedJamaah !== null ? selectedJamaah : undefined);
  };

  const handleFridaySunnahCancel = () => {
    setShowFridaySunnahModal(false);
    completePrayerLog(undefined, selectedJamaah !== null ? selectedJamaah : undefined); // Continue without Friday Sunnah tracking
  };

  const completePrayerLog = (fridaySunnah?: string[], jamaahOverride?: boolean) => {
    if (selectedStatus) {
      // Use jamaahOverride if provided (passed directly from handleJamaahSelect), otherwise use state
      const jamaahValue = jamaahOverride !== undefined ? jamaahOverride : (selectedJamaah !== null ? selectedJamaah : undefined);

      // Debug logging
      logger.debug('=== completePrayerLog DEBUG ===');
      logger.debug('selectedStatus:', selectedStatus);
      logger.debug('selectedJamaah (state):', selectedJamaah);
      logger.debug('jamaahOverride (param):', jamaahOverride);
      logger.debug('jamaahValue to be passed:', jamaahValue);
      logger.debug('fridaySunnah:', fridaySunnah);

      // Log the prayer (preserve jamaah value - null means not applicable, false means alone, true means jamaah)
      onLog(selectedStatus, jamaahValue, fridaySunnah);

      // Get all hadith for this status
      const hadiths = getHadithByStatus(selectedStatus);
      if (hadiths && hadiths.length > 0) {
        setAllHadiths(hadiths);
        setCurrentHadithIndex(0);
        setDisplayedHadith(hadiths[0]);
        setDisplayedStatus(selectedStatus); // Preserve status for modal display
        setShowHadithModal(true);
      }

      // Reset selection state
      setSelectedStatus(null);
      setSelectedJamaah(null);
    }
  };

  const handleNextHadith = () => {
    if (allHadiths.length > 0) {
      const nextIndex = (currentHadithIndex + 1) % allHadiths.length;
      setCurrentHadithIndex(nextIndex);
      setDisplayedHadith(allHadiths[nextIndex]);
    }
  };

  const handleCloseHadithModal = () => {
    setShowHadithModal(false);
    setDisplayedStatus(null);
    setDisplayedHadith(null);
    setAllHadiths([]);
    setCurrentHadithIndex(0);
  };

  const prayerNames: Record<PrayerName, string> = {
    fajr: 'Fajr',
    dhuhr: 'Dhuhr',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha',
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.container, disabled && styles.disabled]}
        onPress={() => !disabled && setShowModal(true)}
        disabled={disabled}
      >
        <View style={styles.content}>
          {/* Prayer Name & Time */}
          <View style={styles.info}>
            <Text style={styles.prayerName}>{prayerNames[prayer]}</Text>
            <Text style={styles.time}>{time}</Text>
          </View>

          {/* Status Indicator */}
          <View style={styles.statusContainer}>
            <View style={styles.statusInfo}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: getStatusColor(status) },
                ]}
              />
              <Text style={[styles.statusText, !status && styles.statusTextMuted]}>
                {getStatusLabel(status)}
              </Text>
            </View>

            {/* Jamaah Badge - only show if prayer is logged and status is on_time */}
            {status === 'on_time' && jamaah !== undefined && (
              <View style={[
                styles.jamaahBadge,
                jamaah ? styles.jamaahBadgeIn : styles.jamaahBadgeAlone
              ]}>
                <Text style={styles.jamaahBadgeIcon}>
                  {jamaah ? '🕌' : '🏠'}
                </Text>
                <Text style={[
                  styles.jamaahBadgeText,
                  jamaah ? styles.jamaahBadgeTextIn : styles.jamaahBadgeTextAlone
                ]}>
                  {jamaah ? 'Jamaah (27×)' : 'Alone (1×)'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Status Selection Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Log {prayerNames[prayer]} Prayer
            </Text>

            <View style={styles.statusOptions}>
              <TouchableOpacity
                style={[styles.statusOption, styles.onTimeOption]}
                onPress={() => handleStatusSelect('on_time')}
              >
                <View style={[styles.statusOptionDot, { backgroundColor: theme.colors.onTime }]} />
                <View style={styles.statusOptionText}>
                  <Text style={styles.statusOptionTitle}>On Time</Text>
                  <Text style={styles.statusOptionDescription}>
                    Prayed within the time window
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusOption, styles.delayedOption]}
                onPress={() => handleStatusSelect('delayed')}
              >
                <View style={[styles.statusOptionDot, { backgroundColor: theme.colors.delayed }]} />
                <View style={styles.statusOptionText}>
                  <Text style={styles.statusOptionTitle}>Delayed</Text>
                  <Text style={styles.statusOptionDescription}>
                    Prayed late but within time
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusOption, styles.missedOption]}
                onPress={() => handleStatusSelect('missed')}
              >
                <View style={[styles.statusOptionDot, { backgroundColor: theme.colors.missed }]} />
                <View style={styles.statusOptionText}>
                  <Text style={styles.statusOptionTitle}>Missed</Text>
                  <Text style={styles.statusOptionDescription}>
                    Did not pray on time
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusOption, styles.qadaaOption]}
                onPress={() => handleStatusSelect('qadaa')}
              >
                <View style={[styles.statusOptionDot, { backgroundColor: theme.colors.qadaa }]} />
                <View style={styles.statusOptionText}>
                  <Text style={styles.statusOptionTitle}>Qadaa</Text>
                  <Text style={styles.statusOptionDescription}>
                    Making up a missed prayer
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Jamaah Selection Modal (for On Time prayers) */}
      <Modal
        visible={showJamaahModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowJamaahModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowJamaahModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Where did you pray {prayerNames[prayer]}?
            </Text>

            <View style={styles.statusOptions}>
              {/* In Jamaah (Mosque) - 27x reward */}
              <TouchableOpacity
                style={[styles.statusOption, styles.jamaahOption]}
                onPress={() => handleJamaahSelect(true)}
              >
                <View style={styles.jamaahIconContainer}>
                  <Text style={styles.jamaahIcon}>🕌</Text>
                </View>
                <View style={styles.statusOptionText}>
                  <Text style={styles.statusOptionTitle}>In Congregation (Jamaah)</Text>
                  <Text style={styles.statusOptionDescription}>
                    Prayed in mosque with congregation
                  </Text>
                  <View style={styles.rewardBadge}>
                    <Text style={styles.rewardText}>27× Reward</Text>
                    <Text style={styles.rewardSource}>Sahih Bukhari & Muslim</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Alone - 1x reward */}
              <TouchableOpacity
                style={[styles.statusOption, styles.aloneOption]}
                onPress={() => handleJamaahSelect(false)}
              >
                <View style={styles.jamaahIconContainer}>
                  <Text style={styles.jamaahIcon}>🏠</Text>
                </View>
                <View style={styles.statusOptionText}>
                  <Text style={styles.statusOptionTitle}>Alone (Individual)</Text>
                  <Text style={styles.statusOptionDescription}>
                    Prayed individually at home or work
                  </Text>
                  <View style={styles.rewardBadge}>
                    <Text style={styles.rewardText}>1× Reward</Text>
                    <Text style={styles.rewardSource}>Base reward</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowJamaahModal(false);
                setSelectedStatus(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Friday Sunnah Checklist Modal */}
      <FridaySunnahChecklist
        visible={showFridaySunnahModal}
        onComplete={handleFridaySunnahComplete}
        onCancel={handleFridaySunnahCancel}
      />

      {/* Prayer Status Hadith Display */}
      {displayedHadith && displayedStatus && (
        <Modal
          visible={showHadithModal}
          transparent
          animationType="fade"
          onRequestClose={handleCloseHadithModal}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={handleCloseHadithModal}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContent}>
                {/* Hadith Counter */}
                {allHadiths.length > 1 && (
                  <View style={styles.hadithCounter}>
                    <Text style={styles.hadithCounterText}>
                      Hadith {currentHadithIndex + 1} of {allHadiths.length}
                    </Text>
                  </View>
                )}

                <PrayerStatusHadith
                  hadith={displayedHadith}
                  status={displayedStatus}
                />

                {/* Action Buttons */}
                <View style={styles.hadithActions}>
                  {allHadiths.length > 1 && (
                    <TouchableOpacity
                      style={styles.nextButton}
                      onPress={handleNextHadith}
                    >
                      <Text style={styles.nextButtonText}>
                        Next Hadith →
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      allHadiths.length === 1 && styles.submitButtonFull
                    ]}
                    onPress={handleCloseHadithModal}
                  >
                    <Text style={styles.submitButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* Reward Animation Modal */}
      <RewardAnimationModal
        visible={showRewardModal}
        isJamaah={rewardIsJamaah}
        onComplete={handleRewardAnimationComplete}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...theme.shadows.sm,
  },
  disabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  prayerName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  time: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },
  statusContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: theme.borderRadius.full,
  },
  statusText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  statusTextMuted: {
    color: theme.colors.text.secondary,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...theme.shadows.lg,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  statusOptions: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border.light,
    gap: theme.spacing.md,
  },
  onTimeOption: {
    borderColor: theme.colors.onTime + '40',
    backgroundColor: theme.colors.onTime + '10',
  },
  delayedOption: {
    borderColor: theme.colors.delayed + '40',
    backgroundColor: theme.colors.delayed + '10',
  },
  missedOption: {
    borderColor: theme.colors.missed + '40',
    backgroundColor: theme.colors.missed + '10',
  },
  qadaaOption: {
    borderColor: theme.colors.qadaa + '40',
    backgroundColor: theme.colors.qadaa + '10',
  },
  statusOptionDot: {
    width: 20,
    height: 20,
    borderRadius: theme.borderRadius.full,
  },
  statusOptionText: {
    flex: 1,
  },
  statusOptionTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  statusOptionDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  cancelButton: {
    padding: theme.spacing.md,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.gray[100],
  },
  cancelButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },

  // Jamaah modal styles
  jamaahOption: {
    borderColor: theme.colors.primary[400] + '40',
    backgroundColor: theme.colors.primary[50],
  },
  aloneOption: {
    borderColor: theme.colors.gray[400] + '40',
    backgroundColor: theme.colors.gray[50],
  },
  jamaahIconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jamaahIcon: {
    fontSize: 28,
  },
  rewardBadge: {
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.primary[100],
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  rewardText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[700],
    marginBottom: 2,
  },
  rewardSource: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary[600],
    fontStyle: 'italic',
  },

  // Jamaah badge on card
  jamaahBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    gap: 4,
  },
  jamaahBadgeIn: {
    backgroundColor: theme.colors.primary[100],
    borderWidth: 1,
    borderColor: theme.colors.primary[300],
  },
  jamaahBadgeAlone: {
    backgroundColor: theme.colors.gray[100],
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
  },
  jamaahBadgeIcon: {
    fontSize: 12,
  },
  jamaahBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  jamaahBadgeTextIn: {
    color: theme.colors.primary[700],
  },
  jamaahBadgeTextAlone: {
    color: theme.colors.gray[700],
  },

  // Hadith modal styles
  hadithCounter: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  hadithCounterText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary[600],
  },
  hadithActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  nextButton: {
    flex: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.gray[100],
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary[600],
  },
  nextButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary[600],
  },
  submitButton: {
    flex: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary[600],
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  submitButtonFull: {
    flex: 1,
  },
  submitButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.white,
  },
});

export default PrayerCard;
