# App Icon Assets

This folder contains all the icon assets for the Sunnah Habit Checker app.

## Icon Design Concept

The app icon features three main elements that represent the core functionality:

1. **Crescent Moon & Star** - Islamic symbol representing faith and prayer
2. **Open Book** - Represents the Qur'an and Islamic knowledge
3. **Checkmark Badge** - Represents habit completion and tracking

### Color Scheme
- **Primary Green**: `#4CAF50` - Represents growth, peace, and nature
- **Dark Green**: `#2E7D32` - Used for accents and depth
- **White**: `#FFFFFF` - Used for icons and text contrast

## Generated Icon Files

### Main Icons
- **`icon.png`** (1024×1024px) - Main app icon for iOS and Android
- **`adaptive-icon.png`** (1024×1024px) - Adaptive icon foreground for Android
- **`favicon.png`** (48×48px) - Web favicon
- **`splash-icon.png`** (512×512px) - Splash screen icon
- **`notification-icon.png`** (96×96px) - Notification icon for Android (monochrome)

### Source Files (SVG)
- **`icon-design.svg`** - Source design for main icon
- **`adaptive-icon-foreground.svg`** - Source design for adaptive icon
- **`notification-icon.svg`** - Source design for notification icon

## Regenerating Icons

If you need to modify the icons:

1. Edit the SVG source files
2. Run the generation script:
   ```bash
   node scripts/generateIcons.js
   ```

## Configuration in app.json

The icons are configured in `app.json`:

```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash-icon.png"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#4CAF50"
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#4CAF50"
        }
      ]
    ]
  }
}
```

## Android Adaptive Icon

The Android adaptive icon uses:
- **Foreground**: `adaptive-icon.png` (1024×1024px with safe zones)
- **Background**: Solid color `#4CAF50` (green)

The safe zone for adaptive icons is 264px from each edge, giving a 496×496px content area.

## Icon Guidelines

### iOS
- Icons should be 1024×1024px
- PNG format with no transparency
- No rounded corners (iOS applies automatically)

### Android
- Adaptive icons use foreground + background
- Foreground should respect safe zones
- Notification icons must be monochrome (white on transparent)

### Web
- Favicon: 48×48px or 32×32px
- PNG format with transparency supported

## Credits

Icons designed for Sunnah Habit Checker
Generated using: Node.js + Sharp image processing library
