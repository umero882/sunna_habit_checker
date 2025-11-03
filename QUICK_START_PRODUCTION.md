# Quick Start: Production Deployment

**One-page guide to get your Sunnah Habit Checker app to production**

---

## 🚨 Before You Start

**CRITICAL:** Rotate your Supabase credentials (they were exposed in the assessment)

---

## Step 1: Fix Remaining TypeScript Errors (~30 min - 2 hours)

```bash
# Check current errors
npx tsc --noEmit

# Focus on these files:
# - src/hooks/useProfile.ts (property mismatches)
# - src/navigation/RootNavigator.tsx (navigation types)
# - src/hooks/useQuranAudio.ts (variable declarations)
```

**Quick wins:**
- Add missing properties to type definitions
- Fix navigation type names to match routes
- Reorder variable declarations

---

## Step 2: Security Setup (~15 min)

### A. Rotate Supabase Keys
1. Go to https://supabase.com/dashboard
2. Project Settings → API → Generate new anon key
3. Update `.env.development` with new keys
4. **DO NOT commit** real keys to git

### B. Setup EAS Secrets
```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Add production secrets (NEVER commit these)
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "your_prod_url"
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your_prod_key"
eas secret:create --name EXPO_PUBLIC_PRAYER_TIMES_API_KEY --value "your_api_key"
```

---

## Step 3: Configure EAS (~10 min)

```bash
# Configure project
eas build:configure

# This will ask:
# - Which platforms? → Select iOS and Android
# - Generate credentials? → Yes

# Update app.json with EAS project ID (generated above)
```

Edit `app.json`:
```json
{
  "extra": {
    "eas": {
      "projectId": "YOUR_GENERATED_PROJECT_ID"
    }
  },
  "owner": "your-expo-username"
}
```

---

## Step 4: Update Bundle IDs (~5 min)

**IMPORTANT:** Bundle IDs must be unique

Edit `app.json`:
```json
{
  "ios": {
    "bundleIdentifier": "com.yourcompany.sunnahhabits"  // Must be unique
  },
  "android": {
    "package": "com.yourcompany.sunnahhabits"  // Must be unique
  }
}
```

**Check availability:**
- iOS: https://developer.apple.com/account/resources/identifiers/list
- Android: Usually available unless very generic

---

## Step 5: First Build (~30-45 min)

### Development Build (Test Locally)
```bash
# Build for iOS
eas build --profile development --platform ios

# Build for Android
eas build --profile development --platform android

# Install on device
# iOS: Download from EAS dashboard, install via cable
# Android: Download APK, install directly
```

### Preview Build (Internal Testing)
```bash
# Create preview APK
eas build --profile preview --platform android

# Create iOS ad-hoc build
eas build --profile preview --platform ios
```

---

## Step 6: Testing Checklist (~2-3 hours)

Test on physical devices:

- [ ] Sign up with new account
- [ ] Sign in with existing account
- [ ] Grant location permission
- [ ] View prayer times (should match your location)
- [ ] Log a prayer
- [ ] Read Quran page
- [ ] Play Quran audio
- [ ] Test offline mode (airplane mode)
- [ ] Receive prayer notification
- [ ] Export data
- [ ] Sign out

**Fix any critical bugs before production build**

---

## Step 7: Production Build (~1 hour)

```bash
# Build for production
eas build --profile production --platform all

# This will:
# - Use production environment variables (from EAS Secrets)
# - Auto-increment version numbers
# - Generate signed builds for both platforms
```

**Wait for builds to complete** (~30-45 min)

---

## Step 8: App Store Preparation (~2-4 hours)

### iOS App Store Connect

1. **Create App**
   - Go to https://appstoreconnect.apple.com
   - My Apps → + → New App
   - Use same bundle ID as app.json

2. **Upload Build**
   ```bash
   eas submit --platform ios
   ```

3. **Add Metadata**
   - App name: "Sunnah Habit Checker"
   - Subtitle: "Islamic Daily Habit Tracker"
   - Description: [Write compelling description]
   - Keywords: sunnah, prayer, quran, islamic, habits
   - Screenshots: Required (6.5", 5.5", iPad)
   - Privacy Policy URL: **REQUIRED** (create one)

4. **Submit for Review**

### Android Play Console

1. **Create App**
   - Go to https://play.google.com/console
   - Create app → Fill details

2. **Upload Build**
   ```bash
   eas submit --platform android
   ```

3. **Add Store Listing**
   - Short description (80 chars)
   - Full description (4000 chars)
   - Screenshots: Required (phone, tablet)
   - Feature graphic: 1024x500px
   - Privacy policy: **REQUIRED**

4. **Submit for Review**

---

## Step 9: Create Privacy Policy (~30 min)

**Required by both app stores**

### Template Structure:
```
Privacy Policy for Sunnah Habit Checker

1. Information We Collect
   - Location (for prayer times only)
   - Email (for authentication)
   - User habits and progress (stored in Supabase)

2. How We Use Information
   - Calculate prayer times
   - Save your progress
   - Send prayer notifications

3. Data Storage
   - All data stored securely in Supabase
   - Row Level Security enabled
   - You own your data

4. Data Sharing
   - We never share your data with third parties
   - No analytics or tracking
   - Privacy-first design

5. Your Rights
   - Export your data anytime
   - Delete your account anytime
   - Request data removal

6. Contact
   - Email: support@yourapp.com
```

**Host privacy policy on:**
- GitHub Pages (free)
- Your website
- Supabase hosting
- Termly.io (generates privacy policies)

---

## Step 10: Post-Launch Monitoring (~Ongoing)

### Day 1-7: Critical Period

1. **Monitor Crashes**
   ```bash
   # Add Sentry (recommended)
   npx expo install sentry-expo
   ```

2. **Watch Reviews**
   - App Store Connect
   - Play Console
   - Respond within 24 hours

3. **Track Key Metrics**
   - App launches
   - Crash rate (should be < 1%)
   - User retention

### Week 2-4: Optimization

1. **Gather Feedback**
   - In-app feedback form
   - Email surveys
   - Social media

2. **Plan Updates**
   - Bug fixes
   - Performance improvements
   - New features

3. **Iterate**
   - Release updates every 2-3 weeks
   - Always test before releasing

---

## 🆘 Troubleshooting

### Build Fails

```bash
# Clear cache and retry
eas build --clear-cache --profile production --platform ios
```

### TypeScript Errors

```bash
# Bypass for urgent fix (NOT RECOMMENDED)
# Add to tsconfig.json temporarily:
{
  "compilerOptions": {
    "skipLibCheck": true
  }
}
```

### Credentials Issues

```bash
# Reset credentials
eas credentials --platform ios
eas credentials --platform android
```

### App Rejected

**Common reasons:**
1. Missing privacy policy → Add one
2. Location permission unclear → Update description
3. Crashes on review → Test thoroughly
4. Missing functionality → Ensure all features work

---

## 📞 Emergency Contacts

- **Expo Status:** https://status.expo.dev/
- **Supabase Status:** https://status.supabase.com/
- **Support Forum:** https://forums.expo.dev/

---

## 📋 Pre-Launch Final Checklist

**The Night Before Launch:**

- [ ] All TypeScript errors fixed
- [ ] Supabase credentials rotated
- [ ] EAS Secrets configured
- [ ] App tested on real devices
- [ ] Privacy policy published and linked
- [ ] App Store screenshots ready
- [ ] App descriptions written
- [ ] Support email set up
- [ ] Error tracking configured (Sentry)
- [ ] Backup of database schema
- [ ] RLS policies verified
- [ ] All console.log statements removed/disabled
- [ ] App icons verified (all sizes)
- [ ] Splash screen tested
- [ ] Notification permissions tested
- [ ] Location permissions tested
- [ ] Offline mode works
- [ ] Data export works
- [ ] Account deletion works

**If all checked ✅ → You're ready to launch! 🚀**

---

## 🎯 Expected Timeline

| Phase | Duration | Can Start |
|-------|----------|-----------|
| Fix TypeScript Errors | 2-4 hours | Now |
| Security Setup | 30 min | Now |
| EAS Configuration | 30 min | Now |
| First Build | 1 hour | After EAS setup |
| Testing | 4-8 hours | After first build |
| Production Build | 1 hour | After testing |
| App Store Prep | 4-8 hours | Before production |
| Review Process | 1-2 weeks | After submission |

**Total: 2-3 weeks to production** (including app store review)

---

## 💰 Cost Estimate

- Expo (EAS) | Free for 1 build/month, $29/month for more
- Apple Developer | $99/year (required for iOS)
- Google Play | $25 one-time (required for Android)
- Supabase | Free tier (upgrade if needed: $25/month)
- Domain for privacy policy | ~$12/year (optional)

**Minimum:** $124 first year, $99/year after

---

Good luck with your launch! 🚀📿

*May Allah accept this project and make it a means of benefit for the Ummah.*
