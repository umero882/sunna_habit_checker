/**
 * Notification Scheduler Service
 * Manages scheduling and canceling of prayer reminders, Sunnah nudges, and weekly digests
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { PrayerTimes, PrayerName } from '../types';
import { parse, format, addMinutes, isAfter, isBefore } from 'date-fns';

import { createLogger } from '../utils/logger';

const logger = createLogger('notificationScheduler');

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type NotificationType =
  | 'prayer_reminder'
  | 'sunnah_nudge'
  | 'reflection_prompt'
  | 'weekly_digest'
  | 'streak_celebration'
  | 'milestone_achievement';

interface PrayerReminderConfig {
  enabled: boolean;
  minutesBefore: number;
  playAdhan: boolean;
}

interface QuietHours {
  start: string; // HH:mm format
  end: string; // HH:mm format
}

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    logger.warn('Notification permissions not granted');
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('prayers', {
      name: 'Prayer Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });

    await Notifications.setNotificationChannelAsync('sunnah', {
      name: 'Sunnah Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('digest', {
      name: 'Weekly Digest',
      importance: Notifications.AndroidImportance.LOW,
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('achievements', {
      name: 'Achievements & Streaks',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 500, 200, 500],
      enableLights: true,
      lightColor: '#FFD700', // Gold color for celebrations
    });
  }

  return true;
};

/**
 * Check if current time is within quiet hours
 */
const isQuietHours = (quietHours?: QuietHours): boolean => {
  if (!quietHours || !quietHours.start || !quietHours.end) {
    return false;
  }

  const now = new Date();
  const currentTime = format(now, 'HH:mm');

  const startTime = quietHours.start;
  const endTime = quietHours.end;

  // Handle overnight quiet hours (e.g., 22:00 to 06:00)
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime <= endTime;
  }

  return currentTime >= startTime && currentTime <= endTime;
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

/**
 * Cancel notifications by tag
 */
export const cancelNotificationsByTag = async (tag: string): Promise<void> => {
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

  for (const notification of scheduledNotifications) {
    if (notification.content.data?.tag === tag) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
};

/**
 * Schedule prayer reminders for today's prayers
 */
export const schedulePrayerReminders = async (
  prayerTimes: PrayerTimes,
  config: PrayerReminderConfig,
  quietHours?: QuietHours
): Promise<void> => {
  if (!config.enabled) {
    await cancelNotificationsByTag('prayer_reminder');
    return;
  }

  // Cancel existing prayer reminders
  await cancelNotificationsByTag('prayer_reminder');

  const prayers: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const now = new Date();

  for (const prayerName of prayers) {
    const prayerTimeStr = prayerTimes[prayerName];
    if (!prayerTimeStr) continue;

    // Parse prayer time (format: "HH:mm")
    const [hours, minutes] = prayerTimeStr.split(':').map(Number);
    const prayerTime = new Date();
    prayerTime.setHours(hours, minutes, 0, 0);

    // Calculate reminder time (X minutes before prayer)
    const reminderTime = addMinutes(prayerTime, -config.minutesBefore);

    // Skip if reminder time has passed
    if (isBefore(reminderTime, now)) {
      continue;
    }

    // Skip if in quiet hours
    const reminderTimeStr = format(reminderTime, 'HH:mm');
    if (quietHours && isQuietHours(quietHours)) {
      logger.debug(`Skipping ${prayerName} reminder due to quiet hours`);
      continue;
    }

    // Schedule notification
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${prayerName.charAt(0).toUpperCase() + prayerName.slice(1)} Prayer`,
          body: `${config.minutesBefore} minutes until ${prayerName} prayer time 🕌`,
          sound: config.playAdhan ? 'adhan.wav' : 'default',
          data: {
            tag: 'prayer_reminder',
            prayer: prayerName,
            type: 'prayer_reminder',
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderTime,
        },
      });

      logger.debug(`Scheduled ${prayerName} reminder for ${format(reminderTime, 'HH:mm')}`);
    } catch (error) {
      logger.error(`Error scheduling ${prayerName} reminder:`, error);
    }
  }
};

/**
 * Schedule Sunnah habit reminders
 */
export const scheduleSunnahReminders = async (
  reminders: Array<{ time: string; title: string; body: string }>,
  quietHours?: QuietHours
): Promise<void> => {
  // Cancel existing Sunnah reminders
  await cancelNotificationsByTag('sunnah_nudge');

  const now = new Date();

  for (const reminder of reminders) {
    // Parse reminder time
    const [hours, minutes] = reminder.time.split(':').map(Number);
    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);

    // Skip if time has passed
    if (isBefore(reminderTime, now)) {
      continue;
    }

    // Skip if in quiet hours
    if (quietHours && isQuietHours(quietHours)) {
      logger.debug(`Skipping Sunnah reminder at ${reminder.time} due to quiet hours`);
      continue;
    }

    // Schedule notification
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: reminder.title,
          body: reminder.body,
          sound: 'default',
          data: {
            tag: 'sunnah_nudge',
            type: 'sunnah_nudge',
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderTime,
        },
      });

      logger.debug(`Scheduled Sunnah reminder: ${reminder.title} at ${reminder.time}`);
    } catch (error) {
      logger.error('Error scheduling Sunnah reminder:', error);
    }
  }
};

/**
 * Schedule reflection prompt after Isha
 */
export const scheduleReflectionPrompt = async (
  ishaTime: string,
  enabled: boolean,
  quietHours?: QuietHours
): Promise<void> => {
  if (!enabled) {
    await cancelNotificationsByTag('reflection_prompt');
    return;
  }

  // Cancel existing reflection prompts
  await cancelNotificationsByTag('reflection_prompt');

  // Parse Isha time and add 30 minutes
  const [hours, minutes] = ishaTime.split(':').map(Number);
  const reflectionTime = new Date();
  reflectionTime.setHours(hours, minutes + 30, 0, 0);

  const now = new Date();
  if (isBefore(reflectionTime, now)) {
    return; // Skip if time has passed
  }

  // Skip if in quiet hours
  if (quietHours && isQuietHours(quietHours)) {
    logger.debug('Skipping reflection prompt due to quiet hours');
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Daily Reflection 📿',
        body: 'How was your khushūʿ today? Take a moment to reflect on your prayers.',
        sound: 'default',
        data: {
          tag: 'reflection_prompt',
          type: 'reflection_prompt',
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reflectionTime,
      },
    });

    logger.debug(`Scheduled reflection prompt for ${format(reflectionTime, 'HH:mm')}`);
  } catch (error) {
    logger.error('Error scheduling reflection prompt:', error);
  }
};

/**
 * Schedule weekly digest (every Friday morning)
 */
export const scheduleWeeklyDigest = async (enabled: boolean): Promise<void> => {
  if (!enabled) {
    await cancelNotificationsByTag('weekly_digest');
    return;
  }

  // Cancel existing weekly digest
  await cancelNotificationsByTag('weekly_digest');

  try {
    // Schedule for every Friday at 9:00 AM
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Weekly Spiritual Progress 🌿',
        body: 'View your achievements from this week and set goals for the next.',
        sound: 'default',
        data: {
          tag: 'weekly_digest',
          type: 'weekly_digest',
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        weekday: 6, // Friday (1 = Sunday, 7 = Saturday)
        hour: 9,
        minute: 0,
        repeats: true,
      },
    });

    logger.debug('Scheduled weekly digest for every Friday at 9:00 AM');
  } catch (error) {
    logger.error('Error scheduling weekly digest:', error);
  }
};

/**
 * Get all scheduled notifications (for debugging)
 */
export const getScheduledNotifications = async () => {
  return await Notifications.getAllScheduledNotificationsAsync();
};

/**
 * Handle notification received while app is in foreground
 */
export const setupNotificationListeners = () => {
  // Handle notification received while app is in foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
    logger.debug('Notification received in foreground:', notification);
  });

  // Handle notification response (user tapped on notification)
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    logger.debug('Notification tapped:', response);
    const data = response.notification.request.content.data;

    // TODO: Navigate to appropriate screen based on notification type
    // if (data.type === 'prayer_reminder') { /* navigate to prayer screen */ }
  });

  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
};

/**
 * Send instant streak celebration notification
 * Called when user achieves a milestone streak
 */
export interface StreakMilestone {
  type: 'prayer' | 'sunnah' | 'quran';
  name: string; // Prayer name or Habit name
  streakDays: number;
  level?: 'basic' | 'companion' | 'prophetic'; // For Sunnah habits
}

export const sendStreakCelebration = async (milestone: StreakMilestone): Promise<void> => {
  try {
    // Determine celebration message based on streak length
    const getMilestoneMessage = (days: number): string => {
      if (days === 3) return '🌟 Great start!';
      if (days === 7) return '🔥 One week strong!';
      if (days === 14) return '💪 Two weeks of dedication!';
      if (days === 21) return '🌙 21 days - Habit forming!';
      if (days === 30) return '🎊 One month achievement!';
      if (days === 40) return '⭐ 40 days of excellence!';
      if (days === 100) return '👑 Century milestone!';
      if (days === 365) return '🏆 ONE YEAR! Incredible!';
      if (days % 100 === 0) return `🎯 ${days} days! Amazing dedication!`;
      return '🎉 Keep going!';
    };

    // Type-specific emojis
    const typeEmoji = {
      prayer: '🕌',
      sunnah: '✨',
      quran: '📖',
    };

    const title = getMilestoneMessage(milestone.streakDays);

    let body: string;
    if (milestone.type === 'prayer') {
      body = `MashaAllah! ${milestone.streakDays} days of ${milestone.name} prayers on time. May Allah accept your efforts!`;
    } else if (milestone.type === 'sunnah') {
      const levelText = milestone.level ? ` (${milestone.level} level)` : '';
      body = `MashaAllah! ${milestone.streakDays}-day streak for "${milestone.name}"${levelText}. Keep it up!`;
    } else {
      body = `MashaAllah! ${milestone.streakDays} consecutive days of Quran reading. May it be a light for you!`;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${typeEmoji[milestone.type]} ${title}`,
        body,
        sound: 'default',
        data: {
          type: 'streak_celebration',
          tag: `streak_${milestone.type}_${milestone.name}_${milestone.streakDays}`,
          milestoneType: milestone.type,
          streakDays: milestone.streakDays,
        },
        ...(Platform.OS === 'android' && {
          channelId: 'achievements',
        }),
      },
      trigger: null, // Send immediately
    });

    logger.debug(
      `Streak celebration sent: ${milestone.type} ${milestone.name} - ${milestone.streakDays} days`
    );
  } catch (error) {
    logger.error('Error sending streak celebration:', error);
  }
};

/**
 * Send milestone achievement notification
 * Called when user unlocks a major achievement
 */
export interface Achievement {
  title: string;
  description: string;
  icon: string; // Emoji
  category: 'prayer' | 'quran' | 'sunnah' | 'general';
}

export const sendAchievementNotification = async (achievement: Achievement): Promise<void> => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${achievement.icon} Achievement Unlocked!`,
        body: `${achievement.title}: ${achievement.description}`,
        sound: 'default',
        data: {
          type: 'milestone_achievement',
          tag: `achievement_${achievement.title}`,
          category: achievement.category,
        },
        ...(Platform.OS === 'android' && {
          channelId: 'achievements',
        }),
      },
      trigger: null, // Send immediately
    });

    logger.debug(`Achievement notification sent: ${achievement.title}`);
  } catch (error) {
    logger.error('Error sending achievement notification:', error);
  }
};
