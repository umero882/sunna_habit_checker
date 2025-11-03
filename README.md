# Sunnah Habit Checker

A React Native mobile application to help Muslims build consistent, sincere daily Sunnah habits with gentle guidance, authentic references, and privacy-first design.

## Features

### Core Features (MVP)
- **Prayer Times & Tracker**: Accurate prayer times with on-time/delayed/missed/qada tracking
- **Daily Habits**: Track Adhkar, Qur'an reading, Sadaqah, and custom habits
- **Sunnah Benchmarks**: Educational guidance from Qur'an and Sunnah
- **Reminder Engine**: Smart notifications for prayers and habits
- **Dashboard**: Today view and weekly overview with insights
- **Multilingual**: Full Arabic and English support with RTL layout

### Planned Features (v1.0)
- Fasting tracker (Ramadan, Shawwal, Mondays/Thursdays)
- Charity integrations
- Barakah Points (optional educational mode)
- Family/Group circles
- Reflections & Journaling

## Tech Stack

- **Frontend**: React Native (Expo)
- **Language**: TypeScript
- **Navigation**: React Navigation v6
- **State Management**: Zustand + React Query
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **i18n**: i18next with Arabic/English
- **Prayer Times**: Adhan.js library
- **Storage**: Expo SecureStore + AsyncStorage
- **Notifications**: Expo Notifications

## Prerequisites

- Node.js 18+ and npm
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (macOS) or Android Studio (for emulator)
- Supabase account (free tier works)

## Getting Started

### 1. Clone and Install

```bash
cd sunnah-habit-checker
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Run the database schema:
   - Go to SQL Editor in Supabase dashboard
   - Copy contents of `supabase/schema.sql`
   - Execute the SQL

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the App

```bash
# Start Expo dev server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web
```

## Project Structure

```
sunnah-habit-checker/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── auth/           # Authentication components
│   │   ├── common/         # Common components (Button, Card, etc.)
│   │   ├── prayer/         # Prayer-related components
│   │   ├── habits/         # Habit tracking components
│   │   └── dashboard/      # Dashboard components
│   ├── screens/            # Screen components
│   │   ├── onboarding/    # Onboarding flow
│   │   ├── home/          # Home/Today screen
│   │   ├── prayer/        # Prayer screens
│   │   ├── habits/        # Habit screens
│   │   └── settings/      # Settings screens
│   ├── navigation/         # Navigation configuration
│   ├── services/          # External services (Supabase, i18n, etc.)
│   ├── store/             # State management
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript type definitions
│   ├── constants/         # Constants and theme
│   └── locales/           # Translation files
│       ├── en/           # English translations
│       └── ar/           # Arabic translations
├── supabase/              # Database schema and migrations
├── App.tsx               # App entry point
└── package.json
```

## Configuration

### Prayer Times

The app uses the [Adhan.js](https://github.com/batoulapps/adhan-js) library for accurate Islamic prayer time calculations. Supported calculation methods:

- Muslim World League
- Egyptian General Authority
- University of Islamic Sciences, Karachi
- Umm al-Qura University, Makkah
- Dubai
- Qatar, Kuwait, Singapore, North America, Turkey, Tehran

Users can select their preferred method and madhab (Standard/Hanafi for Asr) in settings.

### Localization

The app supports:
- **English (en)**: Default
- **Arabic (ar)**: Full RTL support

Translation files are in `src/locales/{en,ar}/common.json`

## Database Schema

See `supabase/schema.sql` for the complete database schema including:

- User settings
- Prayer times and logs
- Habits and habit logs
- Adhkar templates and logs
- Reading plans and logs
- Charity entries
- Reminders
- Journal entries
- Sunnah benchmarks

All tables use Row Level Security (RLS) for privacy.

## Development Guidelines

### Design Principles

1. **Authentic**: All content references Qur'an/Sunnah with sources
2. **Gentle**: Encourage through small steps, avoid shaming
3. **Private**: End-to-end privacy, everything opt-in to share
4. **Accessible**: Simple flows, large tap targets, clear Arabic support
5. **Offline-first**: Core tracking works without internet

### Code Style

- TypeScript strict mode
- Functional components with hooks
- Consistent naming conventions
- Component-level documentation
- Accessibility labels for all interactive elements

### Testing

```bash
# Run tests (to be implemented)
npm test

# Type checking
npx tsc --noEmit
```

## Roadmap

### Milestone 1 (Weeks 1-2) ✅
- [x] Design system & theme
- [x] i18n scaffold with Arabic/English
- [x] Auth skeleton
- [x] Database schema
- [x] Prayer times calculation service

### Milestone 2 (Weeks 3-4) ✅
- [x] Prayer time engine integration
- [x] Today screen UI
- [x] Prayer logging functionality
- [x] Local storage implementation

### Milestone 3 (Weeks 5-6) ✅
- [x] Habits CRUD
- [x] Reading plan (Quran)
- [x] Adhkar & Sunnah tracking
- [x] Navigation flow (5 tabs: Home, Prayers, Sunnah, Quran, Profile)

### Milestone 4 (Weeks 7-8) 🚧 In Progress
- [x] Reminders & notifications
- [x] Weekly dashboard
- [x] Data export
- [ ] Arabic QA & translation verification
- [ ] Production testing on physical devices

### v1.0 (Weeks 10-16)
- [ ] Fasting tracker
- [ ] Family circles
- [ ] Barakah Points (optional)
- [ ] Journaling
- [ ] Content review by advisor

## Contributing

This is a personal/community project. Contributions welcome following Islamic principles:

1. All religious content must be authentic and sourced
2. Maintain respectful, gentle tone
3. Privacy and security first
4. Accessibility is mandatory, not optional

## License

[To be determined]

## Contact

For questions or suggestions, please open an issue.

---

**Note**: This app is a tool to aid worship, not a substitute for intention (niyyah). May Allah accept our efforts and make consistency easy.
