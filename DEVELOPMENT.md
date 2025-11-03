# Development Guide

This guide provides patterns, conventions, and examples for developing the Sunnah Habit Checker app.

## Table of Contents

1. [Development Workflow](#development-workflow)
2. [Code Patterns](#code-patterns)
3. [Component Guidelines](#component-guidelines)
4. [State Management](#state-management)
5. [API Integration](#api-integration)
6. [Styling Guidelines](#styling-guidelines)
7. [i18n Guidelines](#i18n-guidelines)
8. [Testing](#testing)

## Development Workflow

### Daily Development Flow

```bash
# 1. Start development server
npm start

# 2. Run on your platform of choice
# iOS: press 'i' or run `npm run ios`
# Android: press 'a' or run `npm run android`
# Web: press 'w' or run `npm run web`

# 3. Make changes - hot reload will update automatically

# 4. Check types periodically
npx tsc --noEmit
```

### Branch Strategy (when using Git)

```bash
# Main branch for stable code
main

# Feature branches
feature/prayer-logging
feature/adhkar-checklist
feature/onboarding

# Bug fixes
fix/prayer-time-calculation
fix/rtl-layout-issue
```

## Code Patterns

### 1. Component Structure

Use functional components with TypeScript:

```typescript
/**
 * Component description
 * What it does and when to use it
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

export interface MyComponentProps {
  title: string;
  onPress?: () => void;
  // Add props with descriptions if complex
}

export const MyComponent: React.FC<MyComponentProps> = ({ title, onPress }) => {
  // 1. Hooks at the top
  const [state, setState] = React.useState(false);

  // 2. Handlers
  const handlePress = () => {
    onPress?.();
  };

  // 3. Render
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

// 4. Styles at the bottom
const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
  },
});

export default MyComponent;
```

### 2. Custom Hooks Pattern

Create reusable hooks for data fetching and business logic:

```typescript
// src/hooks/usePrayerTimes.ts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { calculatePrayerTimes } from '../services/prayerTimes';
import type { PrayerTimes } from '../types';

export const usePrayerTimes = (date: Date) => {
  return useQuery({
    queryKey: ['prayerTimes', date.toISOString()],
    queryFn: async () => {
      // 1. Try to fetch from Supabase
      const { data, error } = await supabase
        .from('prayers')
        .select('*')
        .eq('date', date.toISOString().split('T')[0])
        .single();

      if (data) return data as PrayerTimes;

      // 2. Calculate if not cached
      // Get user location and settings
      const location = await getLocation();
      const settings = await getSettings();

      const times = calculatePrayerTimes({
        latitude: location.latitude,
        longitude: location.longitude,
        date,
        calculationMethod: settings.prayerCalcMethod,
        asrMethod: settings.asrMethod,
      });

      // 3. Save to Supabase
      const formatted = formatPrayerTimes(times, userId, date);
      await supabase.from('prayers').insert(formatted);

      return formatted;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

// Usage in component:
const { data: prayerTimes, isLoading, error } = usePrayerTimes(new Date());
```

### 3. Screen Component Pattern

```typescript
// src/screens/home/TodayScreen.tsx

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

// Components
import { PrayerCard } from '../../components/prayer/PrayerCard';
import { QuickLogButtons } from '../../components/prayer/QuickLogButtons';

// Hooks
import { usePrayerTimes } from '../../hooks/usePrayerTimes';

// Theme
import { theme } from '../../constants/theme';

export const TodayScreen: React.FC = () => {
  const { t } = useTranslation();
  const { data: prayerTimes, isLoading } = usePrayerTimes(new Date());

  if (isLoading) {
    return <LoadingView />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.greeting}>{t('home.assalamuAlaikum')}</Text>

        <PrayerCard prayerTimes={prayerTimes} />

        <QuickLogButtons />

        {/* More components */}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  content: {
    padding: theme.spacing.md,
  },
  greeting: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
});

export default TodayScreen;
```

## Component Guidelines

### Accessibility

ALWAYS include accessibility props:

```typescript
<Button
  title="Log Prayer"
  onPress={handlePress}
  accessibilityLabel="Log Fajr prayer as completed"
  accessibilityRole="button"
  accessibilityState={{ disabled: false }}
/>
```

### Performance

Use `React.memo` for components that re-render often:

```typescript
export const PrayerCard = React.memo<PrayerCardProps>(({ prayer, time }) => {
  return (
    <Card>
      <Text>{prayer}: {time}</Text>
    </Card>
  );
});
```

### Prop Validation

Always type your props with TypeScript interfaces:

```typescript
export interface PrayerCardProps {
  prayer: PrayerName;
  time: string;
  onPress?: () => void;
  // Optional props with ?
  // Required props without ?
}
```

## State Management

### 1. Local State (useState)

For component-specific state:

```typescript
const [isExpanded, setIsExpanded] = useState(false);
const [selectedPrayer, setSelectedPrayer] = useState<PrayerName>('fajr');
```

### 2. Server State (React Query)

For data from Supabase:

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['habits'],
  queryFn: async () => {
    const { data } = await supabase.from('habits').select('*');
    return data;
  },
});
```

### 3. Global State (Zustand)

For app-wide state like settings:

```typescript
// src/store/settingsStore.ts
import { create } from 'zustand';
import type { UserSettings } from '../types';

interface SettingsStore {
  settings: UserSettings | null;
  setSettings: (settings: UserSettings) => void;
  updateSettings: (partial: Partial<UserSettings>) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: null,
  setSettings: (settings) => set({ settings }),
  updateSettings: (partial) =>
    set((state) => ({
      settings: state.settings ? { ...state.settings, ...partial } : null,
    })),
}));

// Usage:
const { settings, updateSettings } = useSettingsStore();
```

## API Integration

### Supabase Queries

```typescript
// Fetch
const { data, error } = await supabase
  .from('prayer_logs')
  .select('*')
  .eq('user_id', userId)
  .order('date', { ascending: false });

// Insert
const { data, error } = await supabase
  .from('prayer_logs')
  .insert({
    user_id: userId,
    prayer: 'fajr',
    status: 'on_time',
    date: new Date().toISOString(),
  });

// Update
const { data, error } = await supabase
  .from('prayer_logs')
  .update({ status: 'delayed' })
  .eq('id', logId);

// Delete
const { data, error } = await supabase
  .from('prayer_logs')
  .delete()
  .eq('id', logId);
```

### React Query Mutations

```typescript
const mutation = useMutation({
  mutationFn: async (log: PrayerLog) => {
    const { data, error } = await supabase
      .from('prayer_logs')
      .insert(log);
    if (error) throw error;
    return data;
  },
  onSuccess: () => {
    // Invalidate queries to refetch
    queryClient.invalidateQueries({ queryKey: ['prayerLogs'] });
  },
});

// Usage:
mutation.mutate({
  user_id: userId,
  prayer: 'fajr',
  status: 'on_time',
  date: new Date().toISOString(),
});
```

## Styling Guidelines

### Use Theme Constants

```typescript
// Good ✅
const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
  },
  text: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
  },
});

// Bad ❌
const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  text: {
    fontSize: 16,
    color: '#212121',
  },
});
```

### Responsive Design

```typescript
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const isSmallScreen = width < theme.breakpoints.sm;

const styles = StyleSheet.create({
  container: {
    padding: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
  },
});
```

## i18n Guidelines

### Using Translations

```typescript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();

  return (
    <View>
      <Text>{t('prayers.fajr')}</Text>
      <Text>{t('prayers.nextPrayer')}</Text>

      {/* With interpolation */}
      <Text>{t('habits.streak', { count: 7 })}</Text>

      {/* Pluralization */}
      <Text>{t('habits.quran.pages', { count: pagesRead })}</Text>
    </View>
  );
};
```

### Adding New Translations

1. Add to `src/locales/en/common.json`:
```json
{
  "newFeature": {
    "title": "New Feature",
    "description": "This is a new feature"
  }
}
```

2. Add Arabic translation to `src/locales/ar/common.json`:
```json
{
  "newFeature": {
    "title": "ميزة جديدة",
    "description": "هذه ميزة جديدة"
  }
}
```

3. Use in component:
```typescript
<Text>{t('newFeature.title')}</Text>
```

### RTL Support

The app automatically handles RTL for Arabic. For custom layouts:

```typescript
import { I18nManager } from 'react-native';
import { isRTL } from '../services/i18n';

const styles = StyleSheet.create({
  container: {
    flexDirection: isRTL() ? 'row-reverse' : 'row',
    // Or use I18nManager.isRTL
  },
});
```

## Testing

### Unit Tests (Future)

```typescript
// __tests__/prayerTimes.test.ts
import { calculatePrayerTimes } from '../services/prayerTimes';

describe('Prayer Times', () => {
  it('calculates prayer times for Dubai', () => {
    const times = calculatePrayerTimes({
      latitude: 25.2048,
      longitude: 55.2708,
      date: new Date('2025-01-01'),
      calculationMethod: 'Dubai',
    });

    expect(times).toBeDefined();
    expect(times.fajr).toBeDefined();
  });
});
```

### Component Tests (Future)

```typescript
// __tests__/Button.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../components/common/Button';

describe('Button', () => {
  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button title="Test" onPress={onPress} />
    );

    fireEvent.press(getByText('Test'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

## Common Patterns

### Loading States

```typescript
if (isLoading) {
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={theme.colors.primary[600]} />
    </View>
  );
}
```

### Error States

```typescript
if (error) {
  return (
    <View style={styles.centered}>
      <Text style={styles.error}>{t('errors.generic')}</Text>
      <Button title={t('common.retry')} onPress={refetch} />
    </View>
  );
}
```

### Empty States

```typescript
if (!data || data.length === 0) {
  return (
    <View style={styles.centered}>
      <Text style={styles.emptyText}>{t('habits.noHabits')}</Text>
      <Button
        title={t('habits.addHabit')}
        onPress={() => navigation.navigate('AddHabit')}
      />
    </View>
  );
}
```

## Best Practices

### DOs ✅

- Use TypeScript types for everything
- Use theme constants for colors, spacing, typography
- Add translations for all user-facing text
- Include accessibility labels
- Handle loading, error, and empty states
- Use React Query for server state
- Keep components focused and single-purpose
- Write meaningful commit messages
- Comment complex logic
- Use async/await instead of promises

### DON'Ts ❌

- Don't hardcode colors or spacing
- Don't use inline styles for complex components
- Don't forget error handling
- Don't skip accessibility
- Don't use `any` type in TypeScript
- Don't commit sensitive data (API keys, etc.)
- Don't forget to test on both platforms
- Don't skip Arabic translations
- Don't ignore RTL layout

## Next Steps

1. Read [PROJECT_STATUS.md](PROJECT_STATUS.md) for current status
2. Pick a task from Milestone 2
3. Follow these patterns when building
4. Test on both iOS and Android
5. Test in both English and Arabic
6. Create PR when ready (if using Git workflow)

---

**Happy coding! May your efforts be blessed and beneficial.**
