# Onboarding Screenshots

This directory contains background images/screenshots for the onboarding flow.

## Required Screenshots

### 1. Prayer Tracking Screenshot
**Filename:** `prayer-screen.png`
**Recommended Size:** 1080x2340px (9:19.5 aspect ratio)
**Content:** Screenshot of the Prayer tracking screen showing:
- 5 daily prayers with times
- Prayer status indicators
- Countdown to next prayer
- Calendar/streak view

### 2. Quran Reading Screenshot
**Filename:** `quran-screen.png`
**Recommended Size:** 1080x2340px
**Content:** Screenshot of the Quran reader showing:
- Surah page with Arabic text
- Translation below
- Play button for audio
- Word highlighting effect

### 3. Sunnah Habits Screenshot
**Filename:** `sunnah-screen.png`
**Recommended Size:** 1080x2340px
**Content:** Screenshot of the Sunnah habits screen showing:
- Daily habit checklist
- Progress indicators
- Benchmark badges
- Category tabs

### 4. Notifications Example
**Filename:** `notification-example.png`
**Recommended Size:** 1080x600px (notification banner)
**Content:** Mock notification showing:
- Prayer time alert
- App icon
- Notification text

## How to Create Screenshots

### Option 1: From Running App
1. Run the app on a simulator/device
2. Navigate to each screen (Home, Prayers, Quran, Sunnah)
3. Take screenshot (iOS: Cmd+S, Android: Volume Down + Power)
4. Rename and move to this directory

### Option 2: Use Placeholder Images
Until you have actual screenshots, the onboarding uses gradient overlays that work without background images.

### Option 3: Design Custom Illustrations
- Create custom Islamic-themed illustrations
- Use tools like Figma, Adobe Illustrator
- Export at 2x or 3x resolution for retina displays

## Using Screenshots in Code

Once you have the screenshots, update the onboarding screens:

```typescript
// Example: FeaturesPrayerScreen.tsx
import prayerScreenshot from '../../../assets/onboarding/prayer-screen.png';

<OnboardingSlide
  backgroundImage={prayerScreenshot}
  title="Never Miss a Prayer"
  // ...
/>
```

## Image Optimization

Before adding to the app:
1. **Compress images:** Use TinyPNG or ImageOptim
2. **Target size:** < 500KB per image
3. **Format:** PNG with transparency or JPG
4. **Resolution:** @2x (720x1560) or @3x (1080x2340)

## Notes

- Images are optional - gradients work well without backgrounds
- Ensure screenshots don't contain personal/sensitive data
- Consider using mockups for App Store/Play Store
- Update images when app UI changes significantly

## Current Status

- [ ] prayer-screen.png
- [ ] quran-screen.png
- [ ] sunnah-screen.png
- [ ] notification-example.png

**Last Updated:** 2025-11-02
