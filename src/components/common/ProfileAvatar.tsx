/**
 * ProfileAvatar Component
 * Displays user profile photo or initials in a circular avatar
 * Used across all screens in the top-right corner
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { createLogger } from '../../utils/logger';

const logger = createLogger('ProfileAvatar');
import { theme } from '../../constants/theme';
import { useProfile } from '../../hooks/useProfile';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NavigationProp = BottomTabNavigationProp<any>;

interface ProfileAvatarProps {
  size?: number;
  showBorder?: boolean;
  onPress?: () => void;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  size = 40,
  showBorder = true,
  onPress,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const { profile, getUserInitials } = useProfile();
  const [imageError, setImageError] = React.useState(false);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      // Navigate to Profile tab
      navigation.navigate('Profile');
    }
  };

  // Don't show loading spinner - just show placeholder if no profile yet
  // This prevents the avatar from being stuck in loading state while stats load

  const avatarUrl = profile?.metadata?.avatar_url;
  const borderWidth = showBorder ? 2 : 0;

  // Debug logging
  React.useEffect(() => {
    logger.debug('ProfileAvatar render:', {
      hasProfile: !!profile,
      hasMetadata: !!profile?.metadata,
      avatarUrl: avatarUrl || 'none',
      initials: getUserInitials(),
      willShowImage: !!(avatarUrl && !imageError),
    });
  }, [profile, avatarUrl, imageError, getUserInitials]);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {avatarUrl && !imageError ? (
        <Image
          source={{ uri: avatarUrl }}
          style={[
            styles.avatarImage,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
          onError={e => {
            logger.error('Image load error:', e.nativeEvent.error);
            setImageError(true);
          }}
          onLoad={() => {
            logger.info('Image loaded successfully:', avatarUrl);
          }}
        />
      ) : (
        <View
          style={[
            styles.avatarPlaceholder,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        >
          <Text
            style={[
              styles.avatarText,
              {
                fontSize: size * 0.4, // 40% of avatar size
              },
            ]}
          >
            {getUserInitials()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.primary[100],
    borderColor: theme.colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  avatarImage: {
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    backgroundColor: theme.colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[700],
  },
});

export default ProfileAvatar;
