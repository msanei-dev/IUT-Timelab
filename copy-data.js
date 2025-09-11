// Post-build helper: ensure data.json is available for runtime if code expects it outside the bundled asar.
// Makes the script resilient: creates destination folder if missing and skips silently if source absent.
const fs = require('fs');
const path = require('path');

// Prefer public/data.json as the source of truth during dev
const srcDev = path.join(__dirname, 'public', 'data.json');
// Legacy/fallback source near code (if present)
const srcLegacy = path.join(__dirname, 'src', 'data.json');
const destDir = path.join(__dirname, '.webpack', 'main');
const dest = path.join(destDir, 'data.json');

function safeCopy() {
  const src = fs.existsSync(srcDev) ? srcDev : (fs.existsSync(srcLegacy) ? srcLegacy : null);
  if (!src) {
    console.warn('[copy-data] No data.json found in public/ or src/ – skipping copy.');
    return;
  }
  try {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
    console.log('[copy-data] Copied data.json to .webpack/main');
  } catch (err) {
    console.warn('[copy-data] Non-fatal copy error:', err.message);
  }
}

safeCopy();
