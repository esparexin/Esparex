const fs = require('fs');
const path = require('path');

const gradlePath = path.resolve(__dirname, '../apps/mobile-app/android/app/build.gradle');

if (!fs.existsSync(gradlePath)) {
  console.error('❌ Error: build.gradle not found at', gradlePath);
  process.exit(1);
}

let content = fs.readFileSync(gradlePath, 'utf8');

const versionCodeRegex = /versionCode\s+(\d+)/;
const match = content.match(versionCodeRegex);

if (match) {
  const currentCode = parseInt(match[1], 10);
  const newCode = currentCode + 1;
  content = content.replace(versionCodeRegex, `versionCode ${newCode}`);
  fs.writeFileSync(gradlePath, content);
  console.log(`✅ Android versionCode incremented: ${currentCode} -> ${newCode}`);
} else {
  console.error('❌ Error: Could not find versionCode in build.gradle');
  process.exit(1);
}
