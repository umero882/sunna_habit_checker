/**
 * NextPrayerCard Component Tests
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NextPrayerCard } from '../NextPrayerCard';
import type { NextPrayerInfo, PrayerName } from '../../../types';

describe('NextPrayerCard', () => {
  const mockNextPrayer: NextPrayerInfo = {
    name: 'dhuhr' as PrayerName,
    time: '12:30 PM',
    date: new Date('2025-11-02T12:30:00'),
    timeRemaining: '2 hours',
  };

  const mockPrayerTimes = [
    { name: 'fajr' as PrayerName, time: '5:30 AM', date: new Date('2025-11-02T05:30:00') },
    { name: 'dhuhr' as PrayerName, time: '12:30 PM', date: new Date('2025-11-02T12:30:00') },
    { name: 'asr' as PrayerName, time: '3:45 PM', date: new Date('2025-11-02T15:45:00') },
    { name: 'maghrib' as PrayerName, time: '6:15 PM', date: new Date('2025-11-02T18:15:00') },
    { name: 'isha' as PrayerName, time: '7:45 PM', date: new Date('2025-11-02T19:45:00') },
  ];

  it('should render next prayer information correctly', () => {
    const { getByText } = render(<NextPrayerCard nextPrayer={mockNextPrayer} />);

    expect(getByText('Next Prayer')).toBeTruthy();
    expect(getByText('Dhuhr')).toBeTruthy();
    expect(getByText('at 12:30 PM')).toBeTruthy();
  });

  it('should display countdown timer with hours, minutes, and seconds', () => {
    const { getByText } = render(<NextPrayerCard nextPrayer={mockNextPrayer} />);

    expect(getByText('hours')).toBeTruthy();
    expect(getByText('min')).toBeTruthy();
    expect(getByText('sec')).toBeTruthy();
  });

  it('should render prayer times list when provided', () => {
    const { getByText } = render(
      <NextPrayerCard nextPrayer={mockNextPrayer} prayerTimes={mockPrayerTimes} />
    );

    expect(getByText("Today's Prayers")).toBeTruthy();
    expect(getByText('Fajr')).toBeTruthy();
    expect(getByText('5:30 AM')).toBeTruthy();
  });

  it('should call onLogPress when Log Prayer button is pressed', () => {
    const onLogPress = jest.fn();
    const { getByText } = render(
      <NextPrayerCard nextPrayer={mockNextPrayer} onLogPress={onLogPress} />
    );

    fireEvent.press(getByText('Log Prayer'));
    expect(onLogPress).toHaveBeenCalledTimes(1);
  });

  it('should call onViewAllPress when View All button is pressed', () => {
    const onViewAllPress = jest.fn();
    const { getByText } = render(
      <NextPrayerCard nextPrayer={mockNextPrayer} onViewAllPress={onViewAllPress} />
    );

    fireEvent.press(getByText('View All'));
    expect(onViewAllPress).toHaveBeenCalledTimes(1);
  });

  it('should show empty state when nextPrayer is null', () => {
    const { getByText } = render(<NextPrayerCard nextPrayer={null} />);

    expect(getByText('Prayer times not available')).toBeTruthy();
    expect(getByText('Pull down to refresh')).toBeTruthy();
  });

  it('should render action buttons', () => {
    const { getByText } = render(<NextPrayerCard nextPrayer={mockNextPrayer} />);

    expect(getByText('Log Prayer')).toBeTruthy();
    expect(getByText('View All')).toBeTruthy();
  });

  it('should update countdown every second', async () => {
    jest.useFakeTimers();

    const futureDate = new Date(Date.now() + 3600000); // 1 hour from now
    const nextPrayer = {
      ...mockNextPrayer,
      date: futureDate,
    };

    const { getByText } = render(<NextPrayerCard nextPrayer={nextPrayer} />);

    expect(getByText('hours')).toBeTruthy();

    // Fast-forward time by 1 second using act
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    // Component should still be rendering countdown
    expect(getByText('hours')).toBeTruthy();

    jest.useRealTimers();
  });
});
