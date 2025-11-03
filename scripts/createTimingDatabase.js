/**
 * Convert JSON timing data to SQLite database
 * Run with: node scripts/createTimingDatabase.js
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const TIMING_DIR = path.join(__dirname, '../assets/quran-timing');
const DB_PATH = path.join(__dirname, '../assets/quran-timing.db');

// Reciter mapping
const RECITERS = {
  'Alafasy_128kbps': 'ar.alafasy',
  'Husary_64kbps': 'ar.husary',
  'Husary_Muallim_128kbps': 'ar.husarymujawwad',
  'Minshawy_Mujawwad_192kbps': 'ar.minshawi',
  'Abdul_Basit_Murattal_64kbps': 'ar.abdulbasitmurattal',
  'Abdul_Basit_Mujawwad_128kbps': 'ar.abdulbasitmujawwad',
  'Abdurrahmaan_As-Sudais_192kbps': 'ar.abdurrahmaansudais',
  'Abu_Bakr_Ash-Shaatree_128kbps': 'ar.shaatree',
  'Hani_Rifai_192kbps': 'ar.hanirifai',
  'Saood_ash-Shuraym_128kbps': 'ar.saoodshuraym',
  'Minshawy_Murattal_128kbps': 'ar.muhammadjibreel', // Also used as fallback
  'Mohammad_al_Tablaway_128kbps': 'ar.tablaway',
};

console.log('🗄️ Creating SQLite database for word timing data...\n');

// Delete existing database
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  console.log('✓ Deleted existing database');
}

// Create new database
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  // Create tables
  console.log('✓ Creating tables...');

  db.run(`
    CREATE TABLE IF NOT EXISTS timing_segments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reciter TEXT NOT NULL,
      surah INTEGER NOT NULL,
      ayah INTEGER NOT NULL,
      word_start_index INTEGER NOT NULL,
      word_end_index INTEGER NOT NULL,
      start_ms INTEGER NOT NULL,
      end_ms INTEGER NOT NULL,
      UNIQUE(reciter, surah, ayah, word_start_index)
    )
  `);

  db.run(`
    CREATE INDEX idx_reciter_surah_ayah ON timing_segments(reciter, surah, ayah)
  `);

  console.log('✓ Tables created\n');

  // Insert data from JSON files
  const stmt = db.prepare(`
    INSERT INTO timing_segments (reciter, surah, ayah, word_start_index, word_end_index, start_ms, end_ms)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  let totalSegments = 0;
  let filesProcessed = 0;

  Object.entries(RECITERS).forEach(([fileName, reciterId]) => {
    const filePath = path.join(TIMING_DIR, `${fileName}.json`);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipping ${fileName} - file not found`);
      return;
    }

    console.log(`📝 Processing ${fileName}...`);

    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      let segmentCount = 0;

      data.forEach(ayahData => {
        const { surah, ayah, segments } = ayahData;

        // Skip if segments is missing or invalid
        if (!segments || !Array.isArray(segments)) {
          console.warn(`   ⚠️  Skipping ayah ${surah}:${ayah} - invalid segments`);
          return;
        }

        segments.forEach(([wordStartIndex, wordEndIndex, startMs, endMs]) => {
          stmt.run(reciterId, surah, ayah, wordStartIndex, wordEndIndex, startMs, endMs);
          segmentCount++;
          totalSegments++;
        });
      });

      console.log(`   ✓ Inserted ${segmentCount} segments for ${reciterId}`);
      filesProcessed++;
    } catch (error) {
      console.error(`   ❌ Error processing ${fileName}:`, error.message);
    }
  });

  stmt.finalize();

  console.log(`\n✅ Database created successfully!`);
  console.log(`   Files processed: ${filesProcessed}`);
  console.log(`   Total segments: ${totalSegments.toLocaleString()}`);

  // Get database size
  const stats = fs.statSync(DB_PATH);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`   Database size: ${sizeMB} MB`);
  console.log(`   Compression: ${((1 - stats.size / (27 * 1024 * 1024)) * 100).toFixed(1)}% smaller than JSON\n`);
  console.log(`📍 Database location: ${DB_PATH}`);
});

db.close();
