/**
 * ProfileHeader Component
 * Displays user avatar, greeting, and motivational hadith
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { User, Edit } from 'lucide-react-native';
import { theme } from '../../constants/theme';
import { useProfile } from '../../hooks/useProfile';
import { useGreeting } from '../../hooks/useGreeting';

import { createLogger } from '../../utils/logger';

const logger = createLogger('ProfileHeader');

// Rotating hadiths (will show different one each day)
const dailyHadiths = [
  {
    text: "The strong believer is better and more beloved to Allah than the weak believer, while there is good in both.",
    reference: "Sahih Muslim 2664",
  },
  {
    text: "Whoever says 'SubhanAllah' (Glory be to Allah) 100 times, a thousand good deeds are recorded for him and a thousand bad deeds are wiped away.",
    reference: "Sahih Muslim 2073",
  },
  {
    text: "The most beloved deed to Allah is the most regular and constant even if it were little.",
    reference: "Sahih al-Bukhari 6464",
  },
  {
    text: "Allah does not look at your appearance or wealth, but rather He looks at your hearts and actions.",
    reference: "Sahih Muslim 2564",
  },
  {
    text: "Take advantage of five before five: your youth before your old age, your health before your illness, your wealth before your poverty, your free time before your work, and your life before your death.",
    reference: "Al-Hakim",
  },
];

interface ProfileHeaderProps {
  onEditPress?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ onEditPress }) => {
  const { profile, getUserInitials, getDisplayName, isLoading, error } = useProfile();
  const greeting = useGreeting();
  const [dailyHadith, setDailyHadith] = useState(dailyHadiths[0]);
  const [imageError, setImageError] = useState(false);

  // Log any errors for debugging
  useEffect(() => {
    if (error) {
      logger.debug('ProfileHeader error:', error);
    }
  }, [error]);

  // Debug logging
  useEffect(() => {
    logger.debug('ProfileHeader render:', {
      hasProfile: !!profile,
      hasMetadata: !!profile?.metadata,
      avatarUrl: profile?.metadata?.avatar_url || 'none',
      initials: getUserInitials(),
    });
  }, [profile]);

  useEffect(() => {
    // Select hadith based on day of year
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    const hadithIndex = dayOfYear % dailyHadiths.length;
    setDailyHadith(dailyHadiths[hadithIndex]);
  }, []);

  return (
    <View style={styles.container}>
      {/* Avatar and Name Section */}
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          {profile?.metadata?.avatar_url && !imageError ? (
            <Image
              source={{ uri: profile.metadata.avatar_url }}
              style={styles.avatar}
              onError={(e) => {
                logger.error('ProfileHeader Image load error:', e.nativeEvent.error);
                setImageError(true);
              }}
              onLoad={() => {
                logger.info('ProfileHeader Image loaded successfully:', profile.metadata?.avatar_url);
              }}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getUserInitials()}</Text>
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.greeting}>
            {greeting?.greeting || 'Assalāmu ʿalaykum'}, {getDisplayName()} 🌿
          </Text>
          <Text style={styles.email}>{profile?.email}</Text>
        </View>

        {onEditPress && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={onEditPress}
            activeOpacity={0.7}
          >
            <Edit size={20} color={theme.colors.primary[600]} />
          </TouchableOpacity>
        )}
      </View>

      {/* Daily Hadith Section */}
      <View style={styles.hadithCard}>
        <Text style={styles.hadithText}>"{dailyHadith.text}"</Text>
        <Text style={styles.hadithReference}>— {dailyHadith.reference}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background.primary,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  avatarContainer: {
    marginRight: theme.spacing.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.colors.primary[600],
  },
  avatarText: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[700],
  },
  infoContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  email: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  phone: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  editButton: {
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary[50],
  },
  hadithCard: {
    backgroundColor: theme.colors.secondary[50],
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.secondary[600],
  },
  hadithText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    fontStyle: 'italic',
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.md,
    marginBottom: theme.spacing.sm,
  },
  hadithReference: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
    textAlign: 'right',
  },
});
