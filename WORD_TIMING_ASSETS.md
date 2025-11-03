# Word Timing Data - Bundled Assets

## Overview

The word-by-word Quran highlighting feature uses timing data from the **quran-align** project. This data is now bundled with the app for instant, offline access.

## Asset Location

```
assets/quran-timing/
├── Abdul_Basit_Mujawwad_128kbps.json      (2.3 MB)
├── Abdul_Basit_Murattal_64kbps.json       (2.3 MB)
├── Abdurrahmaan_As-Sudais_192kbps.json    (2.4 MB)
├── Abu_Bakr_Ash-Shaatree_128kbps.json     (2.3 MB)
├── Alafasy_128kbps.json                   (2.3 MB)
├── Hani_Rifai_192kbps.json                (2.3 MB)
├── Husary_64kbps.json                     (2.3 MB)
├── Husary_Muallim_128kbps.json            (2.3 MB)
├── Minshawy_Mujawwad_192kbps.json         (2.3 MB)
├── Minshawy_Murattal_128kbps.json         (2.3 MB)
├── Mohammad_al_Tablaway_128kbps.json      (2.3 MB)
└── Saood_ash-Shuraym_128kbps.json         (2.2 MB)
```

**Total Size**: ~27 MB

## Supported Reciters

| Reciter ID | Display Name | Timing File | Quality |
|------------|--------------|-------------|---------|
| ar.alafasy | Mishary Rashid Alafasy | Alafasy_128kbps | 128kbps |
| ar.husary | Mahmoud Khalil Al-Husary | Husary_64kbps | 64kbps |
| ar.husarymujawwad | Al-Husary Mujawwad | Husary_Muallim_128kbps | 128kbps |
| ar.minshawi | Muhammad Siddiq Al-Minshawi | Minshawy_Mujawwad_192kbps | 192kbps |
| ar.abdulbasitmurattal | Abdul Basit Murattal | Abdul_Basit_Murattal_64kbps | 64kbps |
| ar.abdulbasitmujawwad | Abdul Basit Mujawwad | Abdul_Basit_Mujawwad_128kbps | 128kbps |
| ar.abdurrahmaansudais | Abdurrahman As-Sudais | Abdurrahmaan_As-Sudais_192kbps | 192kbps |
| ar.shaatree | Abu Bakr Ash-Shaatree | Abu_Bakr_Ash-Shaatree_128kbps | 128kbps |
| ar.hanirifai | Hani Rifai | Hani_Rifai_192kbps | 192kbps |
| ar.saoodshuraym | Saood ash-Shuraym | Saood_ash-Shuraym_128kbps | 128kbps |

## Data Format

Each JSON file contains an array of ayah timing objects:

```json
{
  "ayah": 1,
  "surah": 1,
  "segments": [
    [0, 1, 60, 610],      // [wordStartIndex, wordEndIndex, startMs, endMs]
    [1, 2, 620, 1310],
    [2, 3, 1320, 2450],
    [3, 4, 2460, 5970]
  ],
  "stats": {
    "deletions": 0,
    "transpositions": 0,
    "insertions": 0
  }
}
```

### Segment Array Format

Each segment is a 4-element array: `[wordStartIndex, wordEndIndex, startMs, endMs]`

- **wordStartIndex**: Index of first word in segment (0-based)
- **wordEndIndex**: Index of last word in segment + 1
- **startMs**: Start time in milliseconds
- **endMs**: End time in milliseconds

## How It Works

1. **App Load**: Timing data is bundled with the app (no download needed)
2. **First Use**: When user plays an ayah, timing data is loaded from bundled assets
3. **Caching**: Data is cached in AsyncStorage for faster subsequent loads
4. **Synchronization**: Audio position is tracked every 100ms
5. **Word Highlighting**: Current word is calculated from position + timing data
6. **Visual Feedback**: Highlighted word changes color in the UI

## Performance

- **First Load**: ~100-200ms (loading from bundled assets)
- **Subsequent Loads**: ~10-20ms (from AsyncStorage cache)
- **Memory Cache**: Instant access after first load in session
- **Update Frequency**: Word index recalculated every 100ms during playback

## Source

- **Project**: quran-align by cpfair
- **Repository**: https://github.com/cpfair/quran-align
- **License**: Creative Commons Attribution 4.0 International (CC BY 4.0)
- **Release**: 2016-11-24
- **Download**: https://github.com/cpfair/quran-align/releases/download/release-2016-11-24/quran-align-data-2016-11-24.zip

## Updating Timing Data

To update the timing data in the future:

1. Download the latest release from quran-align
2. Extract the ZIP file
3. Replace files in `assets/quran-timing/`
4. Update the version in `wordTimingService.ts` (CACHE_VERSION)
5. Clear AsyncStorage cache to force reload

## Bundle Size Impact

- **Development Build**: ~27 MB added
- **Production Build**: ~5-8 MB added (after compression)
- **First Install**: Longer download time
- **Updates**: Only changed files downloaded

## Alternatives Considered

1. **CDN Hosting** ❌ Requires internet, slower first load
2. **On-Demand Download** ❌ Poor UX, requires internet
3. **Bundled (Current)** ✅ Best UX, works offline, instant access

## Future Optimizations

1. **Selective Bundling**: Only bundle popular reciters
2. **Lazy Loading**: Download additional reciters on-demand
3. **Compression**: Further compress JSON data
4. **Binary Format**: Convert to more efficient format (e.g., MessagePack)
