// This script copies data.json to the .webpack/main directory after build
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'src', 'data.json');
const dest = path.join(__dirname, '.webpack', 'main', 'data.json');

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
  console.log('Copied data.json to .webpack/main');
} else {
  console.error('src/data.json not found!');
}
