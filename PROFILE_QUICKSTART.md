# Profile Feature - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Apply Database Migration

```bash
# Navigate to your project
cd C:\Users\umera\sunnah-habit-checker

# Push migration to Supabase
supabase db push
```

**Or manually via Supabase Studio:**
1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to SQL Editor
4. Copy and paste contents of `supabase/migrations/create_user_progress_snapshots.sql`
5. Click "Run"

### Step 2: Run the App

```bash
# Install dependencies (already done)
npm install

# Start Expo
npx expo start
```

### Step 3: Test the Profile Screen

1. **Launch app** on your device/simulator
2. **Sign in** (or create account if needed)
3. **Navigate to Profile tab** (bottom navigation)
4. **You should see:**
   - Your profile header with avatar initials
   - Daily hadith
   - Progress summary (may be empty if you haven't logged data)
   - Collapsible settings sections

### Step 4: Test Core Features

#### Change Language
1. Expand "Spiritual Preferences"
2. Tap "Language"
3. Select "العربية (Arabic)" or "English"
4. App should update (may require restart for full effect)

#### Toggle Hijri Calendar
1. Tap the Hijri Calendar toggle
2. Should see instant update (optimistic)

#### Change Madhhab
1. Tap "Madhhab (Asr Time)"
2. Select "Hanafi" or "Standard"
3. This affects Asr prayer time calculation

#### Export Data (PDF)
1. Expand "Privacy & Data"
2. Tap "Export Data"
3. Select "This Week" or "This Month"
4. Tap "Generate PDF"
5. Note: PDF generation requires additional setup (see below)

---

## 🔧 Optional: Set Up PDF Generation

The PDF export feature currently returns HTML. To enable actual PDF generation:

### Option 1: Use API2PDF (Recommended)

1. **Sign up** at [api2pdf.com](https://www.api2pdf.com/)
2. **Get API key** from dashboard
3. **Add secret to Supabase:**
   ```bash
   supabase secrets set API2PDF_KEY=your_api_key_here
   ```
4. **Update Edge Function** (`supabase/functions/generate-pdf-report/index.ts`):
   ```typescript
   const pdfApiResponse = await fetch('https://v2018.api2pdf.com/chrome/html', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': Deno.env.get('API2PDF_KEY'),
     },
     body: JSON.stringify({
       html: html,
       inlinePdf: true,
       fileName: 'spiritual-progress-report.pdf',
     }),
   });

   const pdfData = await pdfApiResponse.json();

   return new Response(
     JSON.stringify({ pdfUrl: pdfData.pdf }),
     { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
   );
   ```
5. **Deploy:**
   ```bash
   supabase functions deploy generate-pdf-report
   ```

### Option 2: Use Puppeteer (Self-Hosted)

1. **Update Edge Function** with Puppeteer implementation (see commented code in index.ts)
2. **Deploy:**
   ```bash
   supabase functions deploy generate-pdf-report
   ```

### Option 3: Client-Side PDF (No Edge Function)

1. **Install library:**
   ```bash
   npm install react-native-pdf-lib
   ```
2. **Update `src/services/dataExport.ts`** to generate PDF on device
3. **Skip Edge Function** entirely

---

## 📱 Test Notifications

### Request Permissions

The app will request notification permissions when you first toggle notifications. You can also test manually:

```typescript
import { requestNotificationPermissions } from '../services/notificationScheduler';

const granted = await requestNotificationPermissions();
console.log('Permissions granted:', granted);
```

### Schedule Test Notification

```typescript
import * as Notifications from 'expo-notifications';

await Notifications.scheduleNotificationAsync({
  content: {
    title: "Test Notification",
    body: "This is a test from Sunnah Habit Checker!",
  },
  trigger: {
    type: 'date',
    date: new Date(Date.now() + 5000), // 5 seconds from now
  },
});
```

---

## 🎨 Customize the Profile Screen

### Change Colors

Edit `src/constants/theme.ts`:

```typescript
primary: {
  600: '#2d5e4f', // Change this to your preferred color
  // ... other shades
}
```

### Add More Hadiths

Edit `src/components/profile/ProfileHeader.tsx`:

```typescript
const dailyHadiths = [
  {
    text: "Your new hadith text here",
    reference: "Source reference",
  },
  // Add more...
];
```

### Modify Settings Sections

Edit `src/screens/ProfileScreen.tsx`:

```typescript
<SettingsSection
  title="Your New Section"
  icon={<Icon size={24} color={theme.colors.primary[600]} />}
  description="Section description"
>
  <SettingRow
    type="toggle"
    label="Your Setting"
    value={true}
    onToggle={(value) => console.log(value)}
  />
</SettingsSection>
```

---

## 🐛 Troubleshooting

### Charts Not Showing

**Issue:** Progress charts are empty

**Solution:**
1. Check if you have logged data (prayers, Quran, Sunnah)
2. Generate a progress snapshot:
   ```typescript
   // In ProfileScreen.tsx
   import { useGenerateCurrentWeekSnapshot } from '../hooks/useProgressSnapshots';

   const { mutate } = useGenerateCurrentWeekSnapshot();
   useEffect(() => {
     mutate(); // Generate snapshot on mount
   }, []);
   ```

### Settings Not Updating

**Issue:** Changes don't persist

**Solution:**
1. Check Supabase connection
2. Verify RLS policies on `settings` table
3. Check console for errors:
   ```bash
   npx expo start --clear
   ```

### TypeScript Errors

**Issue:** TypeScript compilation errors

**Solution:**
```bash
# Clear TypeScript cache
rm -rf node_modules/.cache

# Reinstall dependencies
npm install

# Check for errors
npx tsc --noEmit
```

### Notifications Not Working

**Issue:** Notifications don't appear

**Solution:**
1. **Check permissions:**
   ```typescript
   import * as Notifications from 'expo-notifications';
   const { status } = await Notifications.getPermissionsAsync();
   console.log('Permission status:', status);
   ```
2. **Verify notification handler is set** (in `notificationScheduler.ts`)
3. **Test with simple notification** (see above)
4. **Check device settings** - ensure notifications are enabled for your app

### PDF Export Fails

**Issue:** "PDF generation requires additional setup" message

**Solution:**
- This is expected! Follow "Optional: Set Up PDF Generation" section above
- For now, the app returns HTML which can be manually converted to PDF

---

## 📚 Further Reading

- [Full Implementation Summary](./PROFILE_FEATURE_IMPLEMENTATION.md)
- [Original Specification](./PROFILE_SPECIFICATION.md) (if you saved it)
- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Victory Native Docs](https://commerce.nearform.com/open-source/victory-native/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

## ✅ Verification Checklist

- [ ] Database migration applied successfully
- [ ] App runs without errors
- [ ] Profile screen loads
- [ ] Settings update and persist
- [ ] Charts display (if you have data)
- [ ] Language switching works
- [ ] Export modal opens
- [ ] Sign out works
- [ ] All sections expand/collapse

---

## 🎉 You're Done!

The Profile feature is now fully functional in your app. Users can:
- ✅ View their spiritual progress with beautiful charts
- ✅ Customize settings (language, madhhab, calendar, etc.)
- ✅ Manage notifications
- ✅ Export their data (once PDF generation is set up)
- ✅ Manage their account

**May Allah accept this work and make it a means of benefit for all users!** 🤲🌿
