const fs = require('fs');

let report = { issues: [] };
try {
  const content = fs.readFileSync('.scratch/knip-report.json', 'utf8');
  report = JSON.parse(content);
} catch (e) {
  console.error('Error reading knip-report.json');
  process.exit(1);
}

const DO_NOT_TOUCH = [
  'node_modules', '.next', 'dist', 'coverage', '.turbo', '.scratch', 
  '.agents', '.venv', 'test-results', 'playwright-report', 
  '__snapshots__', '.snap', '.eslintcache', 'storybook-static', 'public/build'
];

const isIgnored = (filePath) => typeof filePath === 'string' && DO_NOT_TOUCH.some(ignore => filePath.includes(ignore));

const unusedFiles = [];
const unusedDependencies = [];
const unusedDevDependencies = [];
const unusedExports = [];
const unusedTypes = [];
const unusedScripts = [];

// Handle knip json output array or object
const issues = Array.isArray(report) ? report : (report.issues || []);

issues.forEach(item => {
  if (item.file && isIgnored(item.file)) return;
  
  if (item.type === 'files' || (item.files && item.files.length > 0)) {
    (item.files || [item.file]).forEach(f => {
      const fileName = typeof f === 'string' ? f : (f.file || f.name || JSON.stringify(f));
      if (!isIgnored(fileName)) unusedFiles.push(fileName);
    });
  }
  if (item.type === 'dependencies' || (item.dependencies && item.dependencies.length > 0)) {
    (item.dependencies || []).forEach(d => unusedDependencies.push({ file: item.file || 'package.json', name: d.name || d }));
  }
  if (item.type === 'devDependencies' || (item.devDependencies && item.devDependencies.length > 0)) {
    (item.devDependencies || []).forEach(d => unusedDevDependencies.push({ file: item.file || 'package.json', name: d.name || d }));
  }
  if (item.exports && item.exports.length > 0) {
    item.exports.forEach(ex => {
      unusedExports.push({ file: item.file, name: ex.name || ex });
    });
  }
  if (item.types && item.types.length > 0) {
    item.types.forEach(ex => {
      unusedTypes.push({ file: item.file, name: ex.name || ex });
    });
  }
  if (item.scripts && item.scripts.length > 0) {
    item.scripts.forEach(s => {
      unusedScripts.push({ file: item.file || 'package.json', name: s.name || s });
    });
  }
});

let markdown = `# Dead Code Report (Knip Analysis)\n\n`;

markdown += `## P0 - Unused Dependencies (${unusedDependencies.length})\n\n`;
unusedDependencies.forEach(d => markdown += `- \`${d.name}\` (in ${d.file})\n`);

markdown += `\n## P1 - Unused DevDependencies (${unusedDevDependencies.length})\n\n`;
unusedDevDependencies.forEach(d => markdown += `- \`${d.name}\` (in ${d.file})\n`);

markdown += `\n## P1 - Unused Files (${unusedFiles.length})\n\n`;
unusedFiles.forEach(f => markdown += `- \`${f}\`\n`);

markdown += `\n## P2 - Unused Exports (${unusedExports.length})\n\n`;
unusedExports.forEach(e => markdown += `- \`${e.name}\` in \`${e.file}\`\n`);

markdown += `\n## P2 - Unused Types (${unusedTypes.length})\n\n`;
unusedTypes.forEach(t => markdown += `- \`${t.name}\` in \`${t.file}\`\n`);

markdown += `\n## P3 - Unused Scripts (${unusedScripts.length})\n\n`;
unusedScripts.forEach(s => markdown += `- \`${s.name}\` in \`${s.file}\`\n`);

fs.writeFileSync('/Users/admin/.gemini/antigravity-ide/brain/c91865ed-6a72-443d-9d15-fda86d367d8e/4_dead_code_report.md', markdown);
console.log('Dead code report generated with P0-P3 priorities and exclusions.');
