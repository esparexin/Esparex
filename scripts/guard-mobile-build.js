const fs = require('fs');
const path = require('path');

const outDir = path.resolve(__dirname, '../user-frontend/out');
const indexHtml = path.join(outDir, 'index.html');

console.log('🔍 Checking web build integrity...');

if (!fs.existsSync(outDir)) {
  console.error('❌ Error: user-frontend/out directory missing.');
  console.error('   Please run "npm run build" in user-frontend first.');
  process.exit(1);
}

if (!fs.existsSync(indexHtml)) {
  console.error('❌ Error: user-frontend/out/index.html missing. Static export might have failed.');
  process.exit(1);
}

const stats = fs.statSync(indexHtml);
const now = new Date();
const diffMinutes = (now - stats.mtime) / 1000 / 60;

if (diffMinutes > 5) {
  console.error(`❌ Error: Build is STALE (${Math.round(diffMinutes)} minutes old).`);
  console.error('   A fresh build is required for mobile sync to ensure version consistency.');
  process.exit(1);
}

console.log('✅ Mobile build guard passed. Fresh web build detected.');
