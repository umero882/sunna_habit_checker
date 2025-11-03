/**
 * Generate app icons from SVG source
 * Requires: npm install -D sharp
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.error('❌ Sharp is not installed. Installing now...');
  console.log('Run: npm install -D sharp');
  process.exit(1);
}

const assetsDir = path.join(__dirname, '..', 'assets');
const iconSvgPath = path.join(assetsDir, 'icon-design.svg');
const adaptiveForegroundSvgPath = path.join(assetsDir, 'adaptive-icon-foreground.svg');
const notificationIconSvgPath = path.join(assetsDir, 'notification-icon.svg');

// Icon configurations
const icons = [
  // Main app icon (iOS and Android)
  {
    input: iconSvgPath,
    output: path.join(assetsDir, 'icon.png'),
    size: 1024,
    description: 'App icon (1024x1024)',
  },
  // Adaptive icon foreground (Android)
  {
    input: adaptiveForegroundSvgPath,
    output: path.join(assetsDir, 'adaptive-icon.png'),
    size: 1024,
    description: 'Adaptive icon foreground (1024x1024)',
  },
  // Favicon
  {
    input: iconSvgPath,
    output: path.join(assetsDir, 'favicon.png'),
    size: 48,
    description: 'Favicon (48x48)',
  },
  // Splash icon (optional, for loading screen)
  {
    input: iconSvgPath,
    output: path.join(assetsDir, 'splash-icon.png'),
    size: 512,
    description: 'Splash icon (512x512)',
  },
  // Notification icon (Android - monochrome)
  {
    input: notificationIconSvgPath,
    output: path.join(assetsDir, 'notification-icon.png'),
    size: 96,
    description: 'Notification icon (96x96)',
  },
];

async function generateIcons() {
  console.log('🎨 Generating app icons...\n');

  for (const icon of icons) {
    try {
      if (!fs.existsSync(icon.input)) {
        console.error(`❌ Source file not found: ${icon.input}`);
        continue;
      }

      await sharp(icon.input)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toFile(icon.output);

      console.log(`✅ ${icon.description}`);
      console.log(`   Output: ${path.basename(icon.output)}\n`);
    } catch (error) {
      console.error(`❌ Error generating ${icon.description}:`, error.message);
    }
  }

  console.log('✨ Icon generation complete!');
  console.log('\n📱 Next steps:');
  console.log('1. Review the generated icons in the assets folder');
  console.log('2. Verify app.json has correct icon paths');
  console.log('3. Test the app on both iOS and Android');
  console.log('4. For production builds, icons will be automatically included');
}

// Run the generator
generateIcons().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
