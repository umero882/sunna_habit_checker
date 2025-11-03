# Qur'an Module - Quick Start Guide

## 🚀 Quick Testing Guide

This guide shows you how to test the Qur'an services and hooks that have been implemented.

---

## Step 1: Run Database Migration

In your Supabase dashboard:
1. Go to SQL Editor
2. Copy the contents of `supabase/migrations/create_quran_tables.sql`
3. Run the migration
4. Verify tables were created: `quran_reading_logs`, `quran_plans`, `quran_reflections`, `quran_bookmarks`, `user_quran_preferences`

---

## Step 2: Test Services (Optional - Before UI)

Create a test file to verify services work:

**Create**: `src/tests/testQuranServices.ts`

```typescript
import { quranApi } from '../services/quranApi';
import { quranDb } from '../services/quranDb';
import { audioService } from '../services/audioService';

export async function testQuranServices() {
  console.log('🧪 Testing Qur'an Services...\n');

  // Test 1: API - Fetch Surah Al-Fatihah
  console.log('1️⃣ Fetching Surah Al-Fatihah from API...');
  const surah = await quranApi.getSurah(1, 'quran-uthmani', 'en.sahih');
  if (surah) {
    console.log(`✅ Success! Surah: ${surah.name}, Ayahs: ${surah.numberOfAyahs}`);
    console.log(`   First Ayah: ${surah.ayahs[0].text.substring(0, 50)}...`);
  } else {
    console.log('❌ Failed to fetch surah');
  }

  // Test 2: Database - Cache Surah
  console.log('\n2️⃣ Caching surah in SQLite...');
  await quranDb.init();
  if (surah) {
    await quranDb.cacheSurah(surah, 'en.sahih');
    const cached = await quranDb.getCachedSurah(1, 'en.sahih');
    console.log(cached ? '✅ Successfully cached and retrieved!' : '❌ Cache failed');
  }

  // Test 3: Database Stats
  console.log('\n3️⃣ Getting database stats...');
  const stats = await quranDb.getStats();
  console.log(`✅ Cached Surahs: ${stats.cachedSurahs}, Bookmarks: ${stats.bookmarks}`);

  // Test 4: Audio - Get URL
  console.log('\n4️⃣ Getting audio URL...');
  const audioUrl = quranApi.getAudioUrl(1, 'ar.alafasy');
  console.log(`✅ Audio URL: ${audioUrl}`);

  console.log('\n✨ All tests complete!');
}
```

**Run from your App.tsx** (temporarily):
```typescript
import { testQuranServices } from './src/tests/testQuranServices';

useEffect(() => {
  testQuranServices();
}, []);
```

---

## Step 3: Test Hooks in a Component

Create a simple test component:

**Create**: `src/screens/QuranTestScreen.tsx`

```typescript
import React, { useState } from 'react';
import { View, Text, Button, ScrollView, StyleSheet } from 'react-native';
import { useQuranReader, useQuranAudio, useQuranProgress } from '../hooks';
import { theme } from '../constants/theme';

export const QuranTestScreen: React.FC = () => {
  const [selectedSurah, setSelectedSurah] = useState(1);

  // Test useQuranReader
  const { surah, isLoading, isCached, currentAyah, goToAyah } = useQuranReader({
    surahNumber: selectedSurah,
    translation: 'en.sahih',
  });

  // Test useQuranAudio
  const { isPlaying, play, pause, downloadSurah } = useQuranAudio({
    reciter: 'ar.alafasy',
  });

  // Test useQuranProgress (pass actual userId)
  const { progress } = useQuranProgress('your-user-id-here');

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading Surah {selectedSurah}...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {surah?.name} ({surah?.nameArabic})
        </Text>
        <Text style={styles.subtitle}>
          {surah?.numberOfAyahs} Ayahs • {surah?.revelationType}
        </Text>
        <Text style={styles.cache}>
          {isCached ? '✅ Cached Offline' : '🌐 From API'}
        </Text>
      </View>

      {/* Navigation */}
      <View style={styles.controls}>
        <Button
          title="Previous Surah"
          onPress={() => setSelectedSurah(Math.max(1, selectedSurah - 1))}
          disabled={selectedSurah === 1}
        />
        <Button
          title="Next Surah"
          onPress={() => setSelectedSurah(Math.min(114, selectedSurah + 1))}
          disabled={selectedSurah === 114}
        />
      </View>

      {/* Audio Controls */}
      <View style={styles.audioControls}>
        <Button
          title={isPlaying ? 'Pause' : 'Play Audio'}
          onPress={() => (isPlaying ? pause() : play(selectedSurah))}
        />
        <Button
          title="Download Audio"
          onPress={() => downloadSurah(selectedSurah)}
        />
      </View>

      {/* Ayahs */}
      <View style={styles.ayahsContainer}>
        {surah?.ayahs.slice(0, 5).map((ayah) => (
          <View key={ayah.number} style={styles.ayahCard}>
            <Text style={styles.ayahNumber}>{ayah.number}</Text>
            <Text style={styles.ayahArabic}>{ayah.text}</Text>
            <Text style={styles.ayahTranslation}>{ayah.translation}</Text>
          </View>
        ))}
      </View>

      {/* Progress Stats */}
      {progress && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Your Progress</Text>
          <Text>📖 Pages Read: {progress.totalPagesRead}</Text>
          <Text>📝 Verses Read: {progress.totalVersesRead}</Text>
          <Text>⏱ Minutes: {progress.totalMinutes}</Text>
          <Text>🔥 Current Streak: {progress.currentStreak} days</Text>
          <Text>🏆 Longest Streak: {progress.longestStreak} days</Text>
          <Text>📊 Completion: {progress.completionPercentage.toFixed(1)}%</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  cache: {
    fontSize: 14,
    color: theme.colors.primary[600],
    marginTop: 8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: theme.spacing.md,
  },
  audioControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
  },
  ayahsContainer: {
    padding: theme.spacing.lg,
  },
  ayahCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 8,
  },
  ayahNumber: {
    fontSize: 14,
    color: theme.colors.primary[600],
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ayahArabic: {
    fontSize: 20,
    color: theme.colors.text.primary,
    textAlign: 'right',
    marginBottom: 8,
    lineHeight: 32,
  },
  ayahTranslation: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  statsContainer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background.secondary,
    margin: theme.spacing.lg,
    borderRadius: 8,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
});

export default QuranTestScreen;
```

**Add to navigation** (temporarily in `MainTabNavigator.tsx`):
```typescript
import { QuranTestScreen } from '../screens/QuranTestScreen';

// In the Tab.Navigator:
<Tab.Screen
  name="QuranTest"
  component={QuranTestScreen}
  options={{ title: 'Qur'an Test' }}
/>
```

---

## Step 4: Test Reading Plan Creation

Create a test for reading plans:

```typescript
import { useReadingPlan } from '../hooks';

function TestPlanComponent() {
  const { createPlan, activePlan, logReading, getTodayProgress } = useReadingPlan(userId);

  const handleCreatePlan = async () => {
    await createPlan({
      name: 'Complete Quran in 30 Days',
      mode: 'pages',
      target_per_day: 20,
      total_target: 604,
      active: true,
    });
  };

  const handleLogReading = async () => {
    await logReading({
      surah_number: 1,
      from_ayah: 1,
      to_ayah: 7,
      pages_read: 1,
      duration_minutes: 5,
    });
  };

  return (
    <View>
      <Button title="Create 30-Day Plan" onPress={handleCreatePlan} />
      <Button title="Log Reading" onPress={handleLogReading} />
      {activePlan && (
        <Text>
          Active Plan: {activePlan.name} - {activePlan.completed}/{activePlan.total_target}
        </Text>
      )}
    </View>
  );
}
```

---

## Expected Results

### ✅ API Service
- Can fetch any Surah (1-114)
- Returns Arabic text + translation
- Provides audio URLs

### ✅ Database Service
- Caches surahs for offline use
- Saves bookmarks
- Tracks reading progress

### ✅ Audio Service
- Generates audio URLs
- Can download for offline
- (Playback requires UI player)

### ✅ Hooks
- `useQuranReader`: Loads surahs with caching
- `useQuranAudio`: Manages audio state
- `useReadingPlan`: CRUD for plans
- `useQuranProgress`: Calculates stats & streaks

---

## 🐛 Troubleshooting

### Issue: "Database not initialized"
**Solution**: Call `await quranDb.init()` before using database methods

### Issue: "User ID required"
**Solution**: Get user ID from Supabase auth:
```typescript
const { data: { user } } = await supabase.auth.getUser();
const userId = user?.id;
```

### Issue: Audio not playing
**Solution**: Ensure audio service is initialized:
```typescript
await audioService.initialize();
```

### Issue: API calls failing
**Solution**: Check internet connection and API health:
```typescript
const isHealthy = await quranApi.healthCheck();
console.log('API Health:', isHealthy);
```

---

## 📝 Quick Examples

### Fetch & Display Surah Al-Kahf
```typescript
const surah = await quranApi.getSurah(18, 'quran-uthmani', 'en.sahih');
console.log(surah.name); // "Al-Kahf"
console.log(surah.ayahs.length); // 110
```

### Cache First 10 Surahs
```typescript
await quranDb.init();
const surahs = await quranApi.getSurahs([1,2,3,4,5,6,7,8,9,10], 'quran-uthmani', 'en.sahih');
await quranDb.cacheSurahs(surahs, 'en.sahih');
```

### Play Surah Yaseen
```typescript
await audioService.initialize();
await audioService.playSurah(36, 'ar.alafasy');
```

### Check Your Reading Streak
```typescript
const { progress } = useQuranProgress(userId);
console.log(`Current Streak: ${progress?.currentStreak} days`);
```

---

## 🎯 Next: Build UI Components

The services and hooks are ready! Next steps:
1. Build TabView layout for QuranScreen
2. Create Today Tab components
3. Create Library Tab with reader
4. Create Planner Tab with plans

See `QURAN_FEATURE_IMPLEMENTATION_SUMMARY.md` for full details.

---

_May this tool help Muslims strengthen their connection with the Qur'an._
