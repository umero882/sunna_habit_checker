/**
 * Fix incorrect logger import paths
 */

const fs = require('fs');
const path = require('path');

const fixes = [
  // Components - need ../../utils/logger
  { file: 'src/components/common/HeaderLogoutButton.tsx', from: "'../utils/logger'", to: "'../../utils/logger'" },
  { file: 'src/components/prayers/PrayerCard.tsx', from: "'../utils/logger'", to: "'../../utils/logger'" },
  { file: 'src/components/profile/EditProfileModal.tsx', from: "'../utils/logger'", to: "'../../utils/logger'" },
  { file: 'src/components/profile/ExportDataModal.tsx', from: "'../utils/logger'", to: "'../../utils/logger'" },
  { file: 'src/components/profile/ProfileHeader.tsx', from: "'../utils/logger'", to: "'../../utils/logger'" },

  // Components/quran - need ../../../utils/logger
  { file: 'src/components/quran/bookmarks/BookmarksListView.tsx', from: "'../utils/logger'", to: "'../../../utils/logger'" },
  { file: 'src/components/quran/library/QuranReader.tsx', from: "'../utils/logger'", to: "'../../../utils/logger'" },
  { file: 'src/components/quran/planner/CreatePlanModal.tsx', from: "'../utils/logger'", to: "'../../../utils/logger'" },
  { file: 'src/components/quran/today/CurrentReadingCard.tsx', from: "'../utils/logger'", to: "'../../../utils/logger'" },
  { file: 'src/components/quran/today/DailyGoalCard.tsx', from: "'../utils/logger'", to: "'../../../utils/logger'" },
  { file: 'src/components/quran/today/QuickLogButton.tsx', from: "'../utils/logger'", to: "'../../../utils/logger'" },

  // Components/sunnah - need ../../utils/logger
  { file: 'src/components/sunnah/LibraryTab.tsx', from: "'../utils/logger'", to: "'../../utils/logger'" },
  { file: 'src/components/sunnah/TodayTab.tsx', from: "'../utils/logger'", to: "'../../utils/logger'" },

  // Screens - need ../../utils/logger
  { file: 'src/screens/auth/SignUpScreen.tsx', from: "'../utils/logger'", to: "'../../utils/logger'" },
  { file: 'src/screens/home/TodayScreen.tsx', from: "'../utils/logger'", to: "'../../utils/logger'" },
  { file: 'src/screens/onboarding/CompletionScreen.tsx', from: "'../utils/logger'", to: "'../../utils/logger'" },
  { file: 'src/screens/onboarding/LocationPermissionScreen.tsx', from: "'../utils/logger'", to: "'../../utils/logger'" },
  { file: 'src/screens/onboarding/PermissionsScreen.tsx', from: "'../utils/logger'", to: "'../../utils/logger'" },
  { file: 'src/screens/onboarding/QuranPreferencesScreen.tsx', from: "'../utils/logger'", to: "'../../utils/logger'" },
];

console.log('🔧 Fixing logger import paths...\n');

let fixed = 0;

fixes.forEach(({ file, from, to }) => {
  const fullPath = path.join(__dirname, '..', file);

  try {
    let content = fs.readFileSync(fullPath, 'utf8');

    if (content.includes(from)) {
      content = content.replace(from, to);
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✓ Fixed: ${file}`);
      fixed++;
    } else if (content.includes(to)) {
      console.log(`⊘ Already correct: ${file}`);
    } else {
      console.log(`⚠ Pattern not found: ${file}`);
    }
  } catch (error) {
    console.error(`✗ Error processing ${file}:`, error.message);
  }
});

console.log(`\n✅ Fixed ${fixed} files!`);
