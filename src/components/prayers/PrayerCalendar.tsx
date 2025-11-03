/**
 * Prayer Calendar Heatmap Component
 * GitHub-style contribution calendar showing prayer completion history
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { format, startOfWeek, eachDayOfInterval, subDays, parseISO } from 'date-fns';
import { theme } from '../../constants/theme';

export interface HeatmapDay {
  date: string;
  count: number;
  level: number; // 0-4 intensity
}

export interface PrayerCalendarProps {
  data: HeatmapDay[];
  onDayPress?: (day: HeatmapDay) => void;
}

/**
 * Get color for heatmap level
 */
const getLevelColor = (level: number): string => {
  switch (level) {
    case 0:
      return theme.colors.gray[200];
    case 1:
      return theme.colors.primary[200];
    case 2:
      return theme.colors.primary[300];
    case 3:
      return theme.colors.primary[500];
    case 4:
      return theme.colors.primary[600];
    default:
      return theme.colors.gray[200];
  }
};

export const PrayerCalendar: React.FC<PrayerCalendarProps> = ({ data, onDayPress }) => {
  // Group days by week
  const weeks = useMemo(() => {
    if (data.length === 0) return [];

    // Get the date range
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const startDate = parseISO(sortedData[0].date);
    const endDate = parseISO(sortedData[sortedData.length - 1].date);

    // Start from Sunday of the first week
    const calendarStart = startOfWeek(startDate, { weekStartsOn: 0 });

    // Get all days in the range
    const allDays = eachDayOfInterval({ start: calendarStart, end: endDate });

    // Create a map for quick lookup
    const dataMap = new Map(data.map(d => [d.date, d]));

    // Group by weeks
    const weekGroups: HeatmapDay[][] = [];
    let currentWeek: HeatmapDay[] = [];

    allDays.forEach((day, index) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayData = dataMap.get(dateStr) || { date: dateStr, count: 0, level: 0 };

      currentWeek.push(dayData);

      // New week starts on Sunday (index 0)
      if (day.getDay() === 6 || index === allDays.length - 1) {
        weekGroups.push([...currentWeek]);
        currentWeek = [];
      }
    });

    return weekGroups;
  }, [data]);

  // Month labels
  const monthLabels = useMemo(() => {
    if (data.length === 0) return [];

    const labels: { month: string; weekIndex: number }[] = [];
    let lastMonth = '';

    weeks.forEach((week, index) => {
      if (week.length > 0) {
        const month = format(parseISO(week[0].date), 'MMM');
        if (month !== lastMonth) {
          labels.push({ month, weekIndex: index });
          lastMonth = month;
        }
      }
    });

    return labels;
  }, [weeks, data]);

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No prayer data available</Text>
        <Text style={styles.emptySubtext}>Start logging prayers to see your calendar</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Prayer History</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.calendarContainer}>
          {/* Month labels */}
          <View style={styles.monthLabelsRow}>
            <View style={styles.dayLabelSpacer} />
            {monthLabels.map((label, index) => (
              <Text
                key={index}
                style={[
                  styles.monthLabel,
                  { marginLeft: label.weekIndex * (CELL_SIZE + CELL_GAP) },
                ]}
              >
                {label.month}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {/* Day labels */}
            <View style={styles.dayLabelsColumn}>
              {dayLabels.map((day, index) => (
                <View key={day + index} style={styles.dayLabelContainer}>
                  {index % 2 === 1 && <Text style={styles.dayLabel}>{day}</Text>}
                </View>
              ))}
            </View>

            {/* Weeks */}
            <View style={styles.weeksContainer}>
              {weeks.map((week, weekIndex) => (
                <View key={weekIndex} style={styles.week}>
                  {week.map((day, dayIndex) => (
                    <TouchableOpacity
                      key={day.date}
                      style={[
                        styles.cell,
                        { backgroundColor: getLevelColor(day.level) },
                      ]}
                      onPress={() => onDayPress?.(day)}
                      activeOpacity={0.7}
                    >
                      {/* Empty cell - color shows the level */}
                    </TouchableOpacity>
                  ))}
                  {/* Fill empty days if week is not complete */}
                  {week.length < 7 &&
                    Array.from({ length: 7 - week.length }).map((_, i) => (
                      <View key={`empty-${i}`} style={styles.emptyCell} />
                    ))}
                </View>
              ))}
            </View>
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <Text style={styles.legendText}>Less</Text>
            {[0, 1, 2, 3, 4].map(level => (
              <View
                key={level}
                style={[styles.legendCell, { backgroundColor: getLevelColor(level) }]}
              />
            ))}
            <Text style={styles.legendText}>More</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const CELL_SIZE = 12;
const CELL_GAP = 3;

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  scrollView: {
    marginHorizontal: -theme.spacing.sm,
  },
  calendarContainer: {
    paddingHorizontal: theme.spacing.sm,
  },
  monthLabelsRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xs,
    height: 20,
  },
  dayLabelSpacer: {
    width: 20,
  },
  monthLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  calendarGrid: {
    flexDirection: 'row',
  },
  dayLabelsColumn: {
    justifyContent: 'space-between',
    marginRight: theme.spacing.xs,
  },
  dayLabelContainer: {
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: CELL_GAP,
    width: 15,
  },
  dayLabel: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  weeksContainer: {
    flexDirection: 'row',
    gap: CELL_GAP,
  },
  week: {
    gap: CELL_GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  emptyCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    gap: theme.spacing.xs / 2,
  },
  legendText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    marginHorizontal: theme.spacing.xs / 2,
  },
  legendCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  emptyContainer: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  emptySubtext: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
});

export default PrayerCalendar;
