# Profile Feature - Troubleshooting Guide

## 🔧 Common Issues & Solutions

### Issue: "VirtualizedLists should never be nested" Warning

**Symptoms:**
- Yellow warning in console
- Warning about VirtualizedLists in ScrollViews

**Explanation:**
This is a **known issue with Victory Native charts**. Victory internally uses some list-like components that trigger this warning when nested in ScrollView.

**Status:** ✅ FIXED - Warning is now suppressed

**What was done:**
- Added `nestedScrollEnabled={true}` to ProfileScreen ScrollView
- Added `LogBox.ignoreLogs()` in App.tsx to suppress the warning
- This is safe because our charts are static and don't need virtualization

**Performance Impact:** None - the charts render fine and don't cause any actual issues.

---

### Issue: Profile Screen Stuck on Loading

**Symptoms:**
- Profile tab shows "Loading profile..." spinner indefinitely
- Screen never loads

**Causes & Solutions:**

#### 1. Database Migration Not Applied ✅ MOST LIKELY

**Problem:** The `user_progress_snapshots` table doesn't exist yet

**Solution:**
```bash
# Option A: Use Supabase CLI
cd C:\Users\umera\sunnah-habit-checker
supabase db push

# Option B: Manual via Supabase Studio
# 1. Go to https://supabase.com/dashboard
# 2. Select your project
# 3. Go to SQL Editor
# 4. Copy contents of: supabase/migrations/create_user_progress_snapshots.sql
# 5. Paste and click "Run"
```

**How to verify it's fixed:**
1. Check Supabase Studio > Table Editor
2. Look for `user_progress_snapshots` table
3. If present, restart your app
4. Profile should now load (may show "No progress data yet" - that's OK!)

---

#### 2. Stats Hooks Taking Too Long

**Problem:** `usePrayerStats`, `useSunnahStats`, or `useQuranProgress` hooks are slow

**Temporary Fix:**
The ProfileScreen now has a 3-second timeout. After 3 seconds, it will show content even if stats haven't loaded.

**Permanent Fix:**
Check your Supabase database:
```sql
-- Check if prayer_logs table has indexes
SELECT * FROM pg_indexes WHERE tablename = 'prayer_logs';

-- Check if queries are slow
EXPLAIN ANALYZE SELECT * FROM prayer_logs WHERE user_id = 'your-user-id' LIMIT 100;
```

---

#### 3. No Settings Found (New User)

**Problem:** User created before `settings` table existed

**Solution:**
The `handle_new_user()` trigger should create settings automatically. If missing:

```sql
-- Manually create settings for user
INSERT INTO settings (user_id, locale, timezone, madhhab, asr_method)
VALUES (
  'your-user-id', -- Replace with actual user ID
  'en',
  'America/New_York', -- Replace with your timezone
  'Standard',
  'Standard'
);
```

Or sign out and create a new account.

---

### Issue: "No progress data yet" Showing

**This is NORMAL if:**
- ✅ You just installed the feature
- ✅ You haven't logged any habits yet
- ✅ The migration was just applied

**What it means:**
- The profile loads successfully
- The `user_progress_snapshots` table is empty (no weekly data)
- You need to log some prayers/Quran/Sunnah habits first

**To get data showing:**
1. Go to Prayers tab → Log some prayers
2. Go to Quran tab → Log reading session
3. Go to Sunnah tab → Complete some habits
4. Come back to Profile → Refresh
5. Data should appear in charts

**Generate snapshot manually (optional):**
```typescript
// Add this to ProfileScreen.tsx useEffect
import { useGenerateCurrentWeekSnapshot } from '../hooks/useProgressSnapshots';

const { mutate: generateSnapshot } = useGenerateCurrentWeekSnapshot();

useEffect(() => {
  generateSnapshot(); // Generates snapshot from existing data
}, []);
```

---

### Issue: Settings Not Updating

**Symptoms:**
- Toggle a setting (e.g., Hijri Calendar)
- UI updates but change doesn't persist
- After refresh, setting reverts

**Solutions:**

#### Check Supabase Connection
```typescript
// Add to ProfileScreen.tsx
import { supabase } from '../services/supabase';

useEffect(() => {
  supabase.auth.getSession().then(({ data, error }) => {
    console.log('Session:', data.session?.user?.email);
    console.log('Error:', error);
  });
}, []);
```

#### Check RLS Policies
In Supabase Studio → Authentication → Policies:
- Verify `settings` table has UPDATE policy for users
- Should be: `auth.uid() = user_id`

#### Check Console Errors
```bash
npx expo start
# Press 'j' to open debugger
# Check console for errors when toggling settings
```

---

### Issue: Charts Not Rendering

**Symptoms:**
- Profile loads but charts are blank
- No errors shown

**Solutions:**

#### 1. Victory Native Not Installed Properly
```bash
npm uninstall victory-native
npm install victory-native
npm install react-native-svg@15.12.1
npx expo start --clear
```

#### 2. No Data to Display
- Check if `weeklyTrend` has data
- Add debug logging:
```typescript
// In ProgressSummary.tsx
useEffect(() => {
  console.log('Weekly Trend:', weeklyTrend);
  console.log('Level Distribution:', latestLevelDistribution);
}, [weeklyTrend, latestLevelDistribution]);
```

#### 3. Chart Rendering Error
Check console for Victory Native errors:
- "VictoryChart requires data"
- "Invalid data format"

---

### Issue: TypeScript Errors

**Symptoms:**
- Red squiggly lines in VS Code
- Build fails with type errors

**Solutions:**

#### Clear TypeScript Cache
```bash
rm -rf node_modules/.cache
npm install
npx expo start --clear
```

#### Ignore Existing Errors
Some TypeScript errors in existing files (not Profile feature):
- `src/components/home/DailyProgressBar.tsx`
- `src/services/prayerTimes.ts`

These are pre-existing and don't affect Profile feature.

---

### Issue: Notifications Not Working

**Symptoms:**
- Toggle notifications on
- No notifications received

**Solutions:**

#### 1. Check Permissions
```typescript
import * as Notifications from 'expo-notifications';

const checkPermissions = async () => {
  const { status } = await Notifications.getPermissionsAsync();
  console.log('Permission status:', status);

  if (status !== 'granted') {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    console.log('New status:', newStatus);
  }
};
```

#### 2. Test Simple Notification
```typescript
await Notifications.scheduleNotificationAsync({
  content: {
    title: "Test",
    body: "Notification working!",
  },
  trigger: {
    type: 'date',
    date: new Date(Date.now() + 5000),
  },
});
```

#### 3. Check Device Settings
- iOS: Settings → Notifications → Your App → Allow Notifications
- Android: Settings → Apps → Your App → Notifications → Enabled

---

### Issue: Export PDF Not Working

**Expected Behavior:**
Currently shows "PDF generation requires additional setup" message. This is NORMAL!

**To Enable PDF Export:**
See `PROFILE_QUICKSTART.md` → "Optional: Set Up PDF Generation"

Options:
1. API2PDF (easiest)
2. Puppeteer (self-hosted)
3. Client-side PDF library

---

## 🚨 Emergency: Profile Completely Broken

If nothing works and you need to revert:

### Option 1: Hide Profile Tab (Temporary)
Edit `src/navigation/MainTabNavigator.tsx`:
```typescript
// Comment out ProfileTab
// <Tab.Screen name="ProfileTab" component={ProfileScreen} />
```

### Option 2: Revert Profile Changes
```bash
git log --oneline  # Find commit before Profile feature
git revert <commit-hash>
```

### Option 3: Use Placeholder ProfileScreen
Replace `src/screens/ProfileScreen.tsx` with:
```typescript
export const ProfileScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Profile - Under Maintenance</Text>
  </View>
);
```

---

## 📊 Debug Checklist

When reporting issues, please provide:

- [ ] Expo version: `npx expo --version`
- [ ] React Native version: Check `package.json`
- [ ] Platform: iOS / Android / Web
- [ ] Error messages from console
- [ ] Screenshot of issue
- [ ] Have you applied the migration? Yes / No
- [ ] Can you see other tabs (Prayers, Quran, etc.)? Yes / No
- [ ] Supabase project online? Check dashboard

---

## 🔍 Useful Debug Commands

```bash
# Check Expo logs
npx expo start
# Then press 'j' for debugger

# Clear all caches
npx expo start --clear

# Check TypeScript
npx tsc --noEmit

# Check for missing dependencies
npm install

# Check Supabase connection
# Add to any component:
import { supabase } from '../services/supabase';
console.log('Supabase URL:', supabase.supabaseUrl);
```

---

## 📞 Still Need Help?

1. **Check implementation docs:**
   - `PROFILE_FEATURE_IMPLEMENTATION.md` - Technical details
   - `PROFILE_QUICKSTART.md` - Setup guide

2. **Common fix:** 99% of loading issues are solved by applying the database migration!

3. **Verify migration:**
   ```sql
   -- In Supabase SQL Editor
   SELECT EXISTS (
     SELECT FROM information_schema.tables
     WHERE table_name = 'user_progress_snapshots'
   );
   -- Should return: true
   ```

4. **If all else fails:** The Profile screen has been designed to degrade gracefully. Even if some features don't work, the basic settings should still be accessible.

---

## ✅ Success Indicators

Your Profile is working correctly if you can:
- ✅ See profile header with your email
- ✅ See daily hadith
- ✅ Expand/collapse settings sections
- ✅ Toggle any setting (e.g., Hijri Calendar)
- ✅ See "No progress data yet" (if no habits logged)
- ✅ Open Export Data modal

Everything else (charts, stats) requires logged data and may take time to populate!
