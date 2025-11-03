/**
 * Fix Broken Import Statements
 * Repairs files where logger import was incorrectly inserted
 */

const fs = require('fs');
const path = require('path');

const FILES_TO_FIX = [
  'src/hooks/useLocation.ts',
  'src/hooks/useOnboarding.ts',
  'src/hooks/useSunnahStats.ts',
  'src/services/sunnahService.ts',
  'src/services/wordTimingService.ts',
  'src/services/wordTimingServiceSimple.ts',
  'src/utils/prayerPerformance.ts',
];

function fixFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  let content = fs.readFileSync(fullPath, 'utf8');

  // Remove incorrectly placed logger import and declaration
  content = content.replace(/^import \{ createLogger \} from '\.\.\/utils\/logger';\n\nconst logger = createLogger\([^)]+\);\n\n/gm, '');

  // Find all imports
  const lines = content.split('\n');
  let lastImportIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('import ') && !line.includes('createLogger')) {
      lastImportIndex = i;
    }
    if (line && !line.startsWith('import') && !line.startsWith('//') && !line.startsWith('/*') && !line.startsWith('*')) {
      break;
    }
  }

  // Insert logger import after last import
  if (lastImportIndex >= 0) {
    const fileName = path.basename(filePath, path.extname(filePath));
    const loggerImport = `import { createLogger } from '../utils/logger';\n\nconst logger = createLogger('${fileName}');\n`;
    lines.splice(lastImportIndex + 1, 0, loggerImport);
    content = lines.join('\n');
  }

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✓ Fixed: ${filePath}`);
}

console.log('🔧 Fixing broken imports...\n');

FILES_TO_FIX.forEach(fixFile);

console.log('\n✅ All imports fixed!');
