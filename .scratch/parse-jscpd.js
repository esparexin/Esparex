const fs = require('fs');
const path = require('path');

const reportPath = '.jscpd-report/jscpd-report.json';
if (!fs.existsSync(reportPath)) {
  console.error(`Error: Could not find ${reportPath}`);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
let duplicates = report.duplicates || [];

// Do Not Touch Registry
const DO_NOT_TOUCH = [
  'node_modules', '.next', 'dist', 'coverage', '.turbo', '.scratch', 
  '.agents', '.venv', 'test-results', 'playwright-report', 
  '__snapshots__', '.snap', '.eslintcache', 'storybook-static', 'public/build'
];

const isIgnored = (filePath) => DO_NOT_TOUCH.some(ignore => filePath.includes(ignore));

duplicates = duplicates.filter(d => !isIgnored(d.firstFile.name) && !isIgnored(d.secondFile.name));

const classifyDuplicate = (dup) => {
  const isExact = dup.tokens >= 150 && dup.lines >= 15;
  const isIntentional = dup.firstFile.name.includes('dto') || dup.firstFile.name.includes('config') || dup.firstFile.name.includes('types');
  
  if (isIntentional) return { type: 'Intentional Duplicate', confidence: 25 };
  if (isExact) return { type: 'Exact Duplicate', confidence: 100 };
  
  // Default to Architectural for similar controllers/services
  return { type: 'Architectural Duplicate', confidence: 75 };
};

const groupDuplicate = (dup) => {
  const fileNames = [dup.firstFile.name.toLowerCase(), dup.secondFile.name.toLowerCase()].join(' ');
  
  if (fileNames.includes('popup')) return 'Popup';
  if (fileNames.includes('auth') || fileNames.includes('login')) return 'Authentication';
  if (fileNames.includes('notify') || fileNames.includes('alert')) return 'Notification';
  if (fileNames.includes('location') || fileNames.includes('geo')) return 'Location';
  if (fileNames.includes('payment') || fileNames.includes('stripe')) return 'Payment';
  if (fileNames.includes('search')) return 'Search';
  if (fileNames.includes('catalog')) return 'Catalog';
  if (fileNames.includes('listing') || fileNames.includes('ad')) return 'Listing';
  if (fileNames.includes('brand')) return 'Brand';
  if (fileNames.includes('model')) return 'Model';
  if (fileNames.includes('media') || fileNames.includes('image')) return 'Media';
  if (fileNames.includes('upload')) return 'Upload';
  if (fileNames.includes('book')) return 'Booking';
  if (fileNames.includes('user') || fileNames.includes('profile')) return 'User';
  
  return 'Other';
};

duplicates.sort((a, b) => b.lines - a.lines);

const grouped = {};
duplicates.forEach(d => {
  const group = groupDuplicate(d);
  if (!grouped[group]) grouped[group] = [];
  grouped[group].push(d);
});

let markdown = `# Duplicate Code Report (Static Analysis)\n\n`;
markdown += `Total Valid Duplicates Found: ${duplicates.length}\n\n`;

for (const [group, dups] of Object.entries(grouped)) {
  markdown += `## Group: ${group} (${dups.length} duplicates)\n\n`;
  dups.forEach((d, i) => {
    const classification = classifyDuplicate(d);
    markdown += `### ${i+1}. ${classification.type} (${classification.confidence}% Confidence)\n`;
    markdown += `- **Lines**: ${d.lines} | **Tokens**: ${d.tokens}\n`;
    markdown += `- **Source A**: \`${d.firstFile.name}\` (Lines ${d.firstFile.start}-${d.firstFile.end})\n`;
    markdown += `- **Source B**: \`${d.secondFile.name}\` (Lines ${d.secondFile.start}-${d.secondFile.end})\n\n`;
  });
}

fs.writeFileSync('/Users/admin/.gemini/antigravity-ide/brain/c91865ed-6a72-443d-9d15-fda86d367d8e/2_duplicate_code_report.md', markdown);
console.log('Duplicate code report generated with advanced classification.');
