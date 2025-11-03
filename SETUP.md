# Sunnah Habit Checker - Setup Guide

This guide will walk you through setting up the Sunnah Habit Checker app from scratch.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Supabase Configuration](#supabase-configuration)
4. [Running the App](#running-the-app)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

1. **Node.js 18+**
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify: `node --version`

2. **npm or yarn**
   - Comes with Node.js
   - Verify: `npm --version`

3. **Expo CLI**
   ```bash
   npm install -g expo-cli
   ```

4. **Git**
   - Download from [git-scm.com](https://git-scm.com/)

### Platform-Specific Requirements

#### For iOS Development (macOS only)
- Xcode 14+ from Mac App Store
- Xcode Command Line Tools: `xcode-select --install`
- CocoaPods: `sudo gem install cocoapods`

#### For Android Development
- [Android Studio](https://developer.android.com/studio)
- Android SDK (API 33+)
- Configure ANDROID_HOME environment variable

#### For Web Development
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Initial Setup

### 1. Install Dependencies

```bash
cd sunnah-habit-checker
npm install
```

This will install all required packages including:
- React Native & Expo
- Navigation libraries
- Supabase client
- i18n libraries
- Prayer times calculation library
- And more...

### 2. Create Environment File

```bash
cp .env.example .env
```

The `.env` file will store your configuration. We'll fill it in the next step.

## Supabase Configuration

Supabase provides the backend infrastructure (database, authentication, and API).

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Project name**: `sunnah-habit-checker` (or your choice)
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your target users (e.g., Middle East, Asia)
   - **Pricing plan**: Free tier is sufficient for development

5. Wait for project to be created (~2 minutes)

### 2. Get API Credentials

1. In your Supabase project dashboard, click "Settings" (gear icon)
2. Go to "API" section
3. Copy these values:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")

### 3. Configure Environment Variables

Edit your `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_APP_ENV=development
```

⚠️ **Important**: Never commit `.env` to version control. It's already in `.gitignore`.

### 4. Set Up Database Schema

1. In Supabase dashboard, go to "SQL Editor"
2. Click "New Query"
3. Open `supabase/schema.sql` in your code editor
4. Copy the entire contents
5. Paste into Supabase SQL Editor
6. Click "Run" or press `Ctrl/Cmd + Enter`

This creates all necessary tables:
- `settings` - User preferences
- `prayers` - Prayer times
- `prayer_logs` - Prayer tracking
- `habits` - User habits
- `habit_logs` - Habit completions
- `adhkar_templates` - Dhikr texts
- `adhkar_logs` - Dhikr completions
- `reading_plans` - Qur'an reading plans
- `reading_logs` - Reading progress
- `charity_entries` - Sadaqah tracking
- `reminders` - Notification settings
- `journal_entries` - Daily reflections
- `sunnah_benchmarks` - Educational content

### 5. Verify Row Level Security (RLS)

RLS is automatically enabled by the schema. Verify in Supabase:

1. Go to "Authentication" → "Policies"
2. Check that each table has policies enabled
3. Users can only access their own data

### 6. (Optional) Enable Social Authentication

To enable Google/Apple sign-in:

#### Google Sign-In:
1. In Supabase: Settings → Auth → Providers
2. Enable Google
3. Follow [Google OAuth setup guide](https://supabase.com/docs/guides/auth/social-login/auth-google)

#### Apple Sign-In:
1. In Supabase: Settings → Auth → Providers
2. Enable Apple
3. Follow [Apple OAuth setup guide](https://supabase.com/docs/guides/auth/social-login/auth-apple)

## Running the App

### Start Development Server

```bash
npm start
```

This opens the Expo DevTools in your browser.

### Run on Different Platforms

#### iOS (macOS only)
```bash
npm run ios
```

Or press `i` in the terminal after `npm start`.

First time setup:
- Expo will install iOS Simulator if not present
- May take a few minutes to build

#### Android
```bash
npm run android
```

Or press `a` in the terminal after `npm start`.

First time setup:
- Ensure Android Studio is installed
- Create an Android Virtual Device (AVD) if none exists
- Start AVD before running command

#### Web
```bash
npm run web
```

Or press `w` in the terminal after `npm start`.

Opens in your default browser at `http://localhost:19006`

### Run on Physical Device

1. Install **Expo Go** app:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Ensure phone and computer are on same WiFi network

3. Run `npm start`

4. Scan QR code:
   - **iOS**: Use Camera app
   - **Android**: Use Expo Go app's "Scan QR Code" button

## Testing

### Test Prayer Time Calculations

```bash
# In Node.js REPL or create a test file
node
```

```javascript
const { calculatePrayerTimes } = require('./src/services/prayerTimes');

const params = {
  latitude: 25.2048,
  longitude: 55.2708,
  date: new Date(),
  calculationMethod: 'Dubai',
  asrMethod: 'Standard',
};

const times = calculatePrayerTimes(params);
console.log(times);
```

### Test i18n

The app should automatically detect your device language:
- If Arabic → shows Arabic UI with RTL
- Otherwise → shows English UI with LTR

To manually test:
1. Change device language to Arabic
2. Restart app
3. Verify RTL layout and Arabic text

## Troubleshooting

### Common Issues

#### 1. "Module not found" errors

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npx expo start --clear
```

#### 2. Supabase connection fails

**Check:**
- `.env` file exists and has correct values
- `EXPO_PUBLIC_` prefix is used (required for Expo)
- No trailing spaces in environment variables
- Restart dev server after changing `.env`

**Test connection:**
```javascript
import { supabase, isSupabaseConfigured } from './src/services/supabase';

console.log('Configured?', isSupabaseConfigured());
```

#### 3. iOS build errors

**Solution:**
```bash
cd ios
pod install
cd ..
npm run ios
```

#### 4. Android build errors

**Solution:**
```bash
cd android
./gradlew clean
cd ..
npm run android
```

#### 5. Prayer times not calculating

**Check:**
- Location permissions granted
- Coordinates are valid (latitude -90 to 90, longitude -180 to 180)
- Date is valid
- Calculation method is supported

#### 6. RTL layout not working

**Note:** RTL changes require app restart. The app will prompt user.

**Solution:**
- Close and reopen app completely
- Clear app data if issue persists

### Getting Help

1. Check [Expo documentation](https://docs.expo.dev/)
2. Check [Supabase documentation](https://supabase.com/docs)
3. Check [React Navigation docs](https://reactnavigation.org/)
4. Open an issue in the project repository

## Next Steps

After successful setup:

1. **Explore the codebase:**
   - Read `README.md` for project overview
   - Check `src/types/index.ts` for data structures
   - Review `src/constants/theme.ts` for design system

2. **Start development:**
   - Follow the roadmap in README.md
   - Implement missing screens
   - Add authentication UI
   - Build onboarding flow

3. **Customize:**
   - Update app name in `app.json`
   - Customize theme colors in `src/constants/theme.ts`
   - Add/modify translation strings

## Production Deployment

For production deployment, see [DEPLOYMENT.md](./DEPLOYMENT.md) (to be created).

Key steps will include:
- Building production bundles
- Configuring app signing
- Setting up EAS Build
- Submitting to App Store / Play Store
- Setting up analytics and crash reporting

---

**May Allah accept your efforts in creating tools that benefit the Ummah.**
