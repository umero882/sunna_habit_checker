# Quick Start Checklist

Get your Sunnah Habit Checker app running in 15 minutes!

## Prerequisites Check

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Expo CLI installed (`npm install -g expo-cli`)
- [ ] iOS Simulator or Android Emulator ready (or physical device with Expo Go)

## Setup Steps

### 1. Install Dependencies (2 min)

```bash
cd sunnah-habit-checker
npm install
```

Wait for all packages to install...

### 2. Set Up Supabase (5 min)

**a) Create Project:**
1. Go to [supabase.com](https://supabase.com) and sign up/in
2. Click "New Project"
3. Fill in:
   - Name: `sunnah-habit-checker`
   - Password: (choose a strong password)
   - Region: (closest to you)
4. Click "Create new project" and wait ~2 minutes

**b) Get API Keys:**
1. In Supabase dashboard → Settings (gear icon) → API
2. Copy:
   - Project URL
   - `anon` `public` key

**c) Configure App:**
```bash
cp .env.example .env
```

Edit `.env` and paste your credentials:
```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**d) Run Database Schema:**
1. In Supabase → SQL Editor → "New Query"
2. Open `supabase/schema.sql` in your code editor
3. Copy all contents
4. Paste in Supabase SQL Editor
5. Click "Run" (or Ctrl/Cmd + Enter)
6. Should see "Success. No rows returned"

### 3. Run the App (3 min)

```bash
npm start
```

This opens Expo DevTools in your browser.

**Choose a platform:**

- **iOS Simulator:** Press `i` (macOS only)
- **Android Emulator:** Press `a` (start AVD first)
- **Physical Device:** Scan QR code with Expo Go app
- **Web:** Press `w`

### 4. Verify It Works (2 min)

The app should:
- [ ] Load without errors
- [ ] Show a basic navigation structure
- [ ] Console shows: "⚠️ Supabase is not configured" (if you haven't set up .env) OR no Supabase warning (if configured correctly)

## Troubleshooting

### "Module not found" errors
```bash
rm -rf node_modules
npm install
npx expo start --clear
```

### Supabase connection fails
- Check `.env` file exists in root directory
- Check variables start with `EXPO_PUBLIC_`
- Check no extra spaces in `.env`
- Restart dev server after changing `.env`

### iOS build fails (macOS)
```bash
cd ios && pod install && cd ..
npm run ios
```

### Android build fails
```bash
cd android && ./gradlew clean && cd ..
npm run android
```

### App crashes on start
- Check console for errors
- Make sure database schema was run successfully
- Try on web first (`w`) for easier debugging

## Next Steps

You're all set! Now you can:

1. **Read the documentation:**
   - [README.md](README.md) - Project overview
   - [PROJECT_STATUS.md](PROJECT_STATUS.md) - What's done & what's next
   - [DEVELOPMENT.md](DEVELOPMENT.md) - Coding patterns & guidelines

2. **Start developing:**
   - Pick a task from Milestone 2 in [PROJECT_STATUS.md](PROJECT_STATUS.md)
   - Follow patterns in [DEVELOPMENT.md](DEVELOPMENT.md)
   - Start with authentication screens or prayer display

3. **Test as you go:**
   - Test on both iOS and Android
   - Test in English and Arabic (change device language)
   - Test on different screen sizes

## Key Files to Know

```
sunnah-habit-checker/
├── App.tsx                          ← Entry point
├── src/
│   ├── types/index.ts              ← All TypeScript types
│   ├── constants/theme.ts          ← Design system
│   ├── services/
│   │   ├── supabase.ts            ← Backend client
│   │   ├── prayerTimes.ts         ← Prayer calculations
│   │   └── i18n.ts                ← Translations
│   ├── components/common/          ← Reusable components
│   ├── locales/
│   │   ├── en/common.json         ← English text
│   │   └── ar/common.json         ← Arabic text
│   └── ...
└── supabase/schema.sql             ← Database structure
```

## Quick Commands Reference

```bash
# Start dev server
npm start

# Run on platforms
npm run ios          # iOS Simulator
npm run android      # Android Emulator
npm run web          # Web browser

# Type checking
npx tsc --noEmit

# Clear cache
npx expo start --clear

# Install new package
npm install package-name

# Update Expo
npx expo install expo@latest
```

## Development Workflow

1. `npm start` - Start dev server
2. Make changes in your editor
3. Hot reload shows changes instantly
4. Check console for errors
5. Test on device/simulator
6. Commit your changes (if using Git)

## Getting Help

- Check [SETUP.md](SETUP.md) for detailed setup
- Check [DEVELOPMENT.md](DEVELOPMENT.md) for coding help
- Check [Expo Docs](https://docs.expo.dev)
- Check [Supabase Docs](https://supabase.com/docs)

---

**Ready to build! May Allah bless your efforts.**

🚀 **You're all set to start developing the Sunnah Habit Checker!**
