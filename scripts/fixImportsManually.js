/**
 * Manually fix the remaining broken imports
 */

const fs = require('fs');
const path = require('path');

const fixes = [
  {
    file: 'src/hooks/useSunnahStats.ts',
    search: /^(import.*\n)+import \{ createLogger \}.*\n\nconst logger.*\n\n/m,
    replace: (match) => {
      const lines = match.trim().split('\n');
      const loggerLines = lines.filter(l => l.includes('createLogger'));
      const otherLines = lines.filter(l => !l.includes('createLogger') && l.trim());
      return otherLines.join('\n') + '\nimport { createLogger } from \'../utils/logger\';\n\nconst logger = createLogger(\'useSunnahStats\');\n\n';
    }
  },
  {
    file: 'src/services/sunnahService.ts',
    search: /^(import.*\n)+import \{ createLogger \}.*\n\nconst logger.*\n\n/m,
    replace: (match) => {
      const lines = match.trim().split('\n');
      const loggerLines = lines.filter(l => l.includes('createLogger'));
      const otherLines = lines.filter(l => !l.includes('createLogger') && l.trim());
      return otherLines.join('\n') + '\nimport { createLogger } from \'../utils/logger\';\n\nconst logger = createLogger(\'sunnahService\');\n\n';
    }
  },
  {
    file: 'src/services/wordTimingService.ts',
    search: /^(import.*\n)+import \{ createLogger \}.*\n\nconst logger.*\n\n/m,
    replace: (match) => {
      const lines = match.trim().split('\n');
      const loggerLines = lines.filter(l => l.includes('createLogger'));
      const otherLines = lines.filter(l => !l.includes('createLogger') && l.trim());
      return otherLines.join('\n') + '\nimport { createLogger } from \'../utils/logger\';\n\nconst logger = createLogger(\'wordTimingService\');\n\n';
    }
  },
  {
    file: 'src/services/wordTimingServiceSimple.ts',
    search: /^(import.*\n)+import \{ createLogger \}.*\n\nconst logger.*\n\n/m,
    replace: (match) => {
      const lines = match.trim().split('\n');
      const loggerLines = lines.filter(l => l.includes('createLogger'));
      const otherLines = lines.filter(l => !l.includes('createLogger') && l.trim());
      return otherLines.join('\n') + '\nimport { createLogger } from \'../utils/logger\';\n\nconst logger = createLogger(\'wordTimingServiceSimple\');\n\n';
    }
  },
  {
    file: 'src/utils/prayerPerformance.ts',
    search: /^(import.*\n)+import \{ createLogger \}.*\n\nconst logger.*\n\n/m,
    replace: (match) => {
      const lines = match.trim().split('\n');
      const loggerLines = lines.filter(l => l.includes('createLogger'));
      const otherLines = lines.filter(l => !l.includes('createLogger') && l.trim());
      return otherLines.join('\n') + '\nimport { createLogger } from \'./logger\';\n\nconst logger = createLogger(\'prayerPerformance\');\n\n';
    }
  },
];

console.log('🔧 Fixing remaining import issues...\n');

fixes.forEach(({ file, search, replace }) => {
  const fullPath = path.join(__dirname, '..', file);
  let content = fs.readFileSync(fullPath, 'utf8');

  // Simple approach: remove all incorrectly placed logger imports, then add at end
  content = content.replace(/^import \{ createLogger \}.*\n\nconst logger = createLogger\([^)]+\);\n\n/gm, '');

  // Find last import
  const lines = content.split('\n');
  let lastImportIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ') || lines[i].trim().startsWith('} from')) {
      lastImportIndex = i;
    }
  }

  if (lastImportIndex >= 0) {
    const fileName = path.basename(file, path.extname(file));
    const relativePath = file.includes('utils/') ? './logger' : '../utils/logger';
    const loggerImport = `\nimport { createLogger } from '${relativePath}';\n\nconst logger = createLogger('${fileName}');\n`;
    lines.splice(lastImportIndex + 1, 0, loggerImport);
    content = lines.join('\n');
  }

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✓ Fixed: ${file}`);
});

console.log('\n✅ All imports fixed!');
