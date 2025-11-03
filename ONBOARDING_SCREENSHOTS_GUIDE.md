# Onboarding Screenshots Implementation Guide

## Overview
This guide explains how to add screenshot backgrounds to your onboarding screens.

## Current State
✅ **Onboarding works WITHOUT screenshots!**
The current implementation uses beautiful gradient overlays that look great on their own. Screenshots are **optional enhancements**.

---

## Quick Start (Add Screenshots Later)

Your onboarding is fully functional as-is with gradient backgrounds. To add screenshots later:

### Step 1: Capture Screenshots
1. Run your app: `npm start`
2. Navigate to these screens and take screenshots:
   - **Prayer Screen** → Save as `assets/onboarding/prayer-screen.png`
   - **Quran Screen** → Save as `assets/onboarding/quran-screen.png`
   - **Sunnah Screen** → Save as `assets/onboarding/sunnah-screen.png`

### Step 2: Add to Onboarding Screens

Update each feature screen to include the background image:

#### FeaturesPrayerScreen.tsx
```typescript
import prayerScreenshot from '../../../assets/onboarding/prayer-screen.png';

export const FeaturesPrayerScreen: React.FC = () => {
  // ... existing code

  return (
    <>
      <OnboardingSlide
        backgroundImage={prayerScreenshot}  // Add this line
        title={t('onboarding.prayer.title', 'Never Miss a Prayer')}
        description={t('onboarding.prayer.description')}
        // ... rest of props
      >
```

#### FeaturesQuranScreen.tsx
```typescript
import quranScreenshot from '../../../assets/onboarding/quran-screen.png';

export const FeaturesQuranScreen: React.FC = () => {
  // ... existing code

  return (
    <>
      <OnboardingSlide
        backgroundImage={quranScreenshot}  // Add this line
        title={t('onboarding.quran.title')}
        // ... rest of props
      >
```

#### FeaturesSunnahScreen.tsx
```typescript
import sunnahScreenshot from '../../../assets/onboarding/sunnah-screen.png';

export const FeaturesSunnahScreen: React.FC = () => {
  // ... existing code

  return (
    <>
      <OnboardingSlide
        backgroundImage={sunnahScreenshot}  // Add this line
        title={t('onboarding.sunnah.title')}
        // ... rest of props
      >
```

### Step 3: Adjust Gradient Opacity (Optional)

If screenshots make text hard to read, increase gradient opacity in each screen:

```typescript
<OnboardingSlide
  backgroundImage={screenshot}
  gradientColors={[
    'rgba(33, 150, 243, 0.98)',  // Increased from 0.95
    'rgba(33, 150, 243, 0.92)',  // Increased from 0.85
  ]}
  // ...
/>
```

---

## Screenshot Specifications

### Recommended Dimensions
- **Width:** 1080px (3x density)
- **Height:** 2340px (9:19.5 aspect ratio, modern phones)
- **Alternative:** 720x1560px (2x density)

### File Format & Size
- **Format:** PNG (with transparency) or JPG
- **Max Size:** 500KB per image (compress with TinyPNG)
- **Color Space:** sRGB

### Content Guidelines
- **Show actual app screens** (not mockups)
- **Remove personal data** (names, locations, etc.)
- **Use demo data** for realistic appearance
- **Ensure good lighting** and contrast
- **Include key UI elements** that match feature descriptions

---

## Alternative: Custom Illustrations

Instead of screenshots, you can create custom illustrations:

### Option 1: Icon-Based Illustrations
```typescript
// Create a custom icon component
const PrayerIllustration = () => (
  <View style={styles.illustration}>
    <Ionicons name="time" size={120} color="white" />
    <Ionicons name="checkmark-circle" size={80} color="white" />
    {/* Add more decorative icons */}
  </View>
);

// Use in OnboardingSlide
<OnboardingSlide
  icon={<PrayerIllustration />}
  // No backgroundImage needed
/>
```

### Option 2: SVG Illustrations
1. Design in Figma/Illustrator
2. Export as SVG
3. Use `react-native-svg` to render

### Option 3: Lottie Animations
1. Create animation in After Effects
2. Export with Lottie
3. Use `lottie-react-native` for playback

---

## Testing Screenshots

After adding screenshots:

### Visual Testing Checklist
- [ ] Text is readable over screenshots
- [ ] Gradients provide sufficient contrast
- [ ] Screenshots don't distract from message
- [ ] Images load quickly (< 500KB each)
- [ ] Works on different screen sizes
- [ ] RTL layout works with screenshots (Arabic)

### Performance Testing
```bash
# Check bundle size impact
npm run android -- --reset-cache
# or
npm run ios -- --reset-cache
```

---

## Advanced: Dynamic Screenshots

For advanced users, you can show different screenshots based on locale:

```typescript
import { useTranslation } from 'react-i18next';

const { i18n } = useTranslation();
const isArabic = i18n.language === 'ar';

const prayerScreenshot = isArabic
  ? require('../../../assets/onboarding/prayer-screen-ar.png')
  : require('../../../assets/onboarding/prayer-screen-en.png');

<OnboardingSlide backgroundImage={prayerScreenshot} />
```

---

## Troubleshooting

### Images Not Showing
1. Check file path is correct
2. Verify image exists in `assets/onboarding/`
3. Clear Metro bundler cache: `npm start -- --reset-cache`
4. Check image format (PNG/JPG only)

### Images Too Large
1. Compress with TinyPNG.com
2. Reduce resolution to 720x1560 (2x)
3. Convert PNG to JPG if no transparency needed

### Text Not Readable
1. Increase gradient opacity (0.95 → 0.98)
2. Add text shadow to title/description
3. Use darker gradient colors
4. Add dark overlay before gradient

### Performance Issues
1. Lazy load images: `import { Image } from 'expo-image'`
2. Use WebP format (if supported)
3. Reduce image resolution
4. Remove screenshots and use gradients only

---

## Recommended Tools

### Screenshot Capture
- **iOS Simulator:** Cmd + S
- **Android Emulator:** Volume Down + Power button
- **Figma/Sketch:** Design mode with mockups

### Image Optimization
- **TinyPNG:** https://tinypng.com/
- **ImageOptim:** https://imageoptim.com/
- **Squoosh:** https://squoosh.app/

### Design Tools
- **Figma:** UI mockups and illustrations
- **Adobe Illustrator:** Vector illustrations
- **Canva:** Quick graphic design

---

## Example: Full Implementation

Here's a complete example with screenshot:

```typescript
// src/screens/onboarding/FeaturesPrayerScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingSlide, OnboardingButtons, ProgressIndicator } from '../../components/onboarding';
import { useOnboarding } from '../../hooks/useOnboarding';
import { theme } from '../../constants/theme';

// Import screenshot (optional)
import prayerScreenshot from '../../../assets/onboarding/prayer-screen.png';

export const FeaturesPrayerScreen: React.FC = () => {
  const { t } = useTranslation();
  const { goToNextStep, goToPreviousStep, currentStepIndex, totalSteps } = useOnboarding();

  return (
    <>
      <OnboardingSlide
        backgroundImage={prayerScreenshot}  // Optional
        title={t('onboarding.prayer.title', 'Never Miss a Prayer')}
        description={t('onboarding.prayer.description')}
        icon={
          <View style={styles.iconCircle}>
            <Ionicons name="time" size={72} color={theme.colors.white} />
          </View>
        }
        gradientColors={['rgba(33, 150, 243, 0.95)', 'rgba(33, 150, 243, 0.85)']}
      >
        {/* Feature list */}
        <View style={styles.featureList}>
          <FeatureItem icon="checkmark-done" text={t('onboarding.prayer.feature1')} />
          <FeatureItem icon="people" text={t('onboarding.prayer.feature2')} />
          <FeatureItem icon="flame" text={t('onboarding.prayer.feature3')} />
          <FeatureItem icon="notifications" text={t('onboarding.prayer.feature4')} />
        </View>
      </OnboardingSlide>

      <ProgressIndicator totalSteps={totalSteps} currentStep={currentStepIndex} />
      <OnboardingButtons
        showBack={true}
        showSkip={true}
        onNext={goToNextStep}
        onBack={goToPreviousStep}
        onSkip={goToNextStep}
      />
    </>
  );
};

// ... styles
```

---

## Summary

**✅ Current Status:** Onboarding works perfectly with gradients only

**📸 Adding Screenshots:** Completely optional enhancement

**🎯 When to Add:**
- After main features are complete
- For App Store/Play Store marketing
- To showcase actual app design
- When you have professional screenshots ready

**💡 Pro Tip:** Start without screenshots, add them later when your app UI is polished and stable.

---

**Last Updated:** 2025-11-02
**Version:** 1.0.0
