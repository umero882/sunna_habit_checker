/**
 * Script to Replace console.log Statements with Production-Safe Logger
 *
 * This script:
 * 1. Scans all TypeScript/JavaScript files in src/
 * 2. Finds console.log, console.warn, console.error, console.debug statements
 * 3. Replaces them with logger equivalents
 * 4. Adds logger import if not present
 *
 * Usage: node scripts/replaceConsoleLogs.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SRC_DIR = path.join(__dirname, '..', 'src');
const DRY_RUN = process.argv.includes('--dry-run');
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// Statistics
let stats = {
  filesScanned: 0,
  filesModified: 0,
  consolesReplaced: 0,
  importsAdded: 0,
  errors: [],
};

/**
 * Get namespace from file path
 * @param {string} filePath - Full file path
 * @returns {string} - Namespace (e.g., 'PrayerService', 'HomeScreen')
 */
function getNamespace(filePath) {
  const relativePath = path.relative(SRC_DIR, filePath);
  const fileName = path.basename(filePath, path.extname(filePath));

  // Extract meaningful name
  if (fileName.includes('.test') || fileName.includes('.spec')) {
    return fileName.replace(/\.(test|spec)/, '');
  }

  return fileName;
}

/**
 * Check if file already has logger import
 * @param {string} content - File content
 * @returns {boolean}
 */
function hasLoggerImport(content) {
  return /import.*createLogger.*from.*logger/.test(content) ||
         /import.*logger.*from.*logger/.test(content);
}

/**
 * Add logger import to file
 * @param {string} content - File content
 * @param {string} namespace - Logger namespace
 * @returns {string} - Modified content
 */
function addLoggerImport(content, namespace) {
  // Find the last import statement
  const importRegex = /^import\s+.*?;?\s*$/gm;
  const matches = [...content.matchAll(importRegex)];

  if (matches.length === 0) {
    // No imports, add at the top after comments
    const firstCodeLine = content.search(/^[^/\n]/m);
    if (firstCodeLine === -1) return content;

    const importStatement = `import { createLogger } from '../utils/logger';\n\nconst logger = createLogger('${namespace}');\n\n`;
    return content.slice(0, firstCodeLine) + importStatement + content.slice(firstCodeLine);
  }

  // Add after last import
  const lastImport = matches[matches.length - 1];
  const insertPos = lastImport.index + lastImport[0].length;

  const importStatement = `\nimport { createLogger } from '../utils/logger';\n\nconst logger = createLogger('${namespace}');\n`;
  return content.slice(0, insertPos) + importStatement + content.slice(insertPos);
}

/**
 * Replace console statements with logger
 * @param {string} content - File content
 * @returns {object} - { content, count }
 */
function replaceConsoleStatements(content) {
  let count = 0;

  // Replace console.log -> logger.debug
  content = content.replace(/\bconsole\.log\(/g, () => {
    count++;
    return 'logger.debug(';
  });

  // Replace console.debug -> logger.debug
  content = content.replace(/\bconsole\.debug\(/g, () => {
    count++;
    return 'logger.debug(';
  });

  // Replace console.info -> logger.info
  content = content.replace(/\bconsole\.info\(/g, () => {
    count++;
    return 'logger.info(';
  });

  // Replace console.warn -> logger.warn
  content = content.replace(/\bconsole\.warn\(/g, () => {
    count++;
    return 'logger.warn(';
  });

  // Replace console.error -> logger.error
  content = content.replace(/\bconsole\.error\(/g, () => {
    count++;
    return 'logger.error(';
  });

  return { content, count };
}

/**
 * Process a single file
 * @param {string} filePath - Full file path
 */
function processFile(filePath) {
  try {
    stats.filesScanned++;

    const originalContent = fs.readFileSync(filePath, 'utf8');
    let content = originalContent;

    // Check if file has any console statements
    if (!/\bconsole\.(log|debug|info|warn|error)\(/.test(content)) {
      return; // No console statements, skip
    }

    const namespace = getNamespace(filePath);
    let modified = false;

    // Add logger import if needed
    if (!hasLoggerImport(content)) {
      content = addLoggerImport(content, namespace);
      stats.importsAdded++;
      modified = true;
    }

    // Replace console statements
    const result = replaceConsoleStatements(content);
    if (result.count > 0) {
      content = result.content;
      stats.consolesReplaced += result.count;
      modified = true;
    }

    if (modified) {
      stats.filesModified++;

      if (DRY_RUN) {
        console.log(`[DRY-RUN] Would modify: ${path.relative(SRC_DIR, filePath)}`);
        console.log(`  - Replaced ${result.count} console statement(s)`);
      } else {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ Modified: ${path.relative(SRC_DIR, filePath)} (${result.count} replacements)`);
      }
    }
  } catch (error) {
    stats.errors.push({ file: filePath, error: error.message });
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
}

/**
 * Recursively scan directory
 * @param {string} dir - Directory path
 */
function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules, dist, build, etc.
      if (!['node_modules', 'dist', 'build', '__tests__', '.git'].includes(entry.name)) {
        scanDirectory(fullPath);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (EXTENSIONS.includes(ext)) {
        processFile(fullPath);
      }
    }
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Console.log Replacement Script\n');
  console.log(`Mode: ${DRY_RUN ? 'DRY-RUN (no files will be modified)' : 'LIVE (files will be modified)'}`);
  console.log(`Scanning: ${SRC_DIR}\n`);

  const startTime = Date.now();

  scanDirectory(SRC_DIR);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary');
  console.log('='.repeat(60));
  console.log(`Files scanned:       ${stats.filesScanned}`);
  console.log(`Files modified:      ${stats.filesModified}`);
  console.log(`Console statements:  ${stats.consolesReplaced}`);
  console.log(`Imports added:       ${stats.importsAdded}`);
  console.log(`Errors:              ${stats.errors.length}`);
  console.log(`Duration:            ${duration}s`);
  console.log('='.repeat(60));

  if (stats.errors.length > 0) {
    console.log('\n❌ Errors:');
    stats.errors.forEach(({ file, error }) => {
      console.log(`  - ${path.relative(SRC_DIR, file)}: ${error}`);
    });
  }

  if (DRY_RUN && stats.filesModified > 0) {
    console.log('\n💡 Run without --dry-run to apply changes');
  }

  if (!DRY_RUN && stats.filesModified > 0) {
    console.log('\n✅ All changes applied successfully!');
  }

  if (stats.filesModified === 0) {
    console.log('\n✨ No console statements found! Your codebase is clean.');
  }
}

// Run the script
main();
