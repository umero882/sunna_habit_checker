/**
 * DailyGoalCard Component
 * Displays daily reading goal with circular progress ring
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '../../../constants/theme';
import { useReadingPlan } from '../../../hooks/useReadingPlan';
import { format } from 'date-fns';

import { createLogger } from '../../../utils/logger';

const logger = createLogger('DailyGoalCard');

interface DailyGoalCardProps {
  userId: string;
}

export const DailyGoalCard: React.FC<DailyGoalCardProps> = ({ userId }) => {
  const { activePlan, getTodayProgress } = useReadingPlan(userId);
  const [todayProgress, setTodayProgress] = useState({ completed: 0, target: 0 });
  const [currentDate, setCurrentDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const isFocused = useIsFocused();

  const loadTodayProgress = async () => {
    const progress = await getTodayProgress();
    setTodayProgress(progress);
    logger.debug(`📊 DailyGoalCard: Loaded progress for ${currentDate}:`, progress);
  };

  // Load progress when plan changes
  useEffect(() => {
    if (activePlan) {
      loadTodayProgress();
    }
  }, [activePlan]);

  // Reload when tab is focused
  useEffect(() => {
    if (isFocused && activePlan) {
      logger.debug('👁️ DailyGoalCard: Tab focused, reloading progress...');
      loadTodayProgress();
    }
  }, [isFocused]);

  // Check for date change every minute
  useEffect(() => {
    const checkDateChange = () => {
      const newDate = format(new Date(), 'yyyy-MM-dd');
      if (newDate !== currentDate) {
        logger.debug(`📅 DailyGoalCard: Date changed from ${currentDate} to ${newDate}`);
        setCurrentDate(newDate);
        // Reset progress to 0 for new day
        setTodayProgress({ completed: 0, target: todayProgress.target });
        // Reload fresh data
        loadTodayProgress();
      }
    };

    const interval = setInterval(checkDateChange, 60000); // Check every minute
    checkDateChange(); // Check immediately

    return () => clearInterval(interval);
  }, [currentDate, todayProgress.target]);

  if (!activePlan) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Active Plan</Text>
          <Text style={styles.emptySubtitle}>
            Create a reading plan to track your daily progress
          </Text>
        </View>
      </View>
    );
  }

  const percentage =
    todayProgress.target > 0
      ? Math.min((todayProgress.completed / todayProgress.target) * 100, 100)
      : 0;

  const isComplete = percentage >= 100;

  // Progress ring dimensions
  const size = 140;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

  // Get unit label based on plan mode
  const getUnitLabel = () => {
    switch (activePlan.mode) {
      case 'pages':
        return 'pages';
      case 'verses':
        return 'verses';
      case 'time':
        return 'minutes';
      default:
        return 'units';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Today's Goal</Text>
        <Text style={styles.planName}>{activePlan.name}</Text>
      </View>

      {/* Progress Ring */}
      <View style={styles.progressContainer}>
        <Svg width={size} height={size} style={styles.svg}>
          {/* Background Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.colors.gray[200]}
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Progress Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isComplete ? theme.colors.success : theme.colors.primary[600]}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>

        {/* Center Text */}
        <View style={styles.centerTextContainer}>
          <Text style={styles.percentageText}>{Math.round(percentage)}%</Text>
          <Text style={styles.progressText}>
            {todayProgress.completed} / {todayProgress.target}
          </Text>
          <Text style={styles.unitText}>{getUnitLabel()}</Text>
        </View>
      </View>

      {/* Status Message */}
      <View style={styles.statusContainer}>
        {isComplete ? (
          <View style={styles.completeBadge}>
            <Text style={styles.completeText}>✓ Goal Complete!</Text>
          </View>
        ) : (
          <Text style={styles.remainingText}>
            {todayProgress.target - todayProgress.completed} {getUnitLabel()} remaining
          </Text>
        )}
      </View>

      {/* Motivation */}
      {isComplete && (
        <View style={styles.motivationContainer}>
          <Text style={styles.motivationText}>
            "Read the Qur'an, for it will come as an intercessor for its reciters on the Day of
            Resurrection."
          </Text>
          <Text style={styles.motivationSource}>- Sahih Muslim</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  planName: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  svg: {
    transform: [{ rotate: '0deg' }],
  },
  centerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[700],
  },
  progressText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.xs,
  },
  unitText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  completeBadge: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  completeText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  remainingText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
  },
  motivationContainer: {
    backgroundColor: theme.colors.primary[50],
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary[600],
  },
  motivationText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontStyle: 'italic',
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.sm,
    marginBottom: theme.spacing.xs,
  },
  motivationSource: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});

export default DailyGoalCard;
