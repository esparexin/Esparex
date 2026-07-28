/**
 * CI Guardrail Script: Enforce Authorization SSOT & Ban Raw Role Strings
 * Excludes: roleNormalization.ts, test files (*.spec.ts, *.test.ts, __mocks__), and explicit compatibility layer.
 */
const fs = require('fs');
const path = require('path');

const BACKEND_API_DIR = path.join(__dirname, '../backend/api/src');

const EXCLUDED_FILES = [
  'roleNormalization.ts',
  'roleNormalization.js',
];

const EXCLUDED_DIR_PATTERNS = [
  '__tests__',
  '__mocks__',
];

function isExcluded(filePath) {
  const baseName = path.basename(filePath);
  if (EXCLUDED_FILES.includes(baseName)) return true;
  if (EXCLUDED_DIR_PATTERNS.some(pattern => filePath.includes(pattern))) return true;
  if (filePath.endsWith('.spec.ts') || filePath.endsWith('.test.ts')) return true;
  return false;
}

function scanDirectory(dir, issues = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!isExcluded(fullPath)) {
        scanDirectory(fullPath, issues);
      }
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
      if (isExcluded(fullPath)) continue;

      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Check for raw legacy super_admin string literal in controller comparisons
        if (line.includes("'super_admin'") || line.includes('"super_admin"')) {
          // Exclude comments
          if (!line.trim().startsWith('//') && !line.trim().startsWith('*')) {
            issues.push({
              file: fullPath,
              line: index + 1,
              content: line.trim(),
              rule: 'Raw string literal "super_admin" banned. Use Role.SUPER_ADMIN and normalizeRole().'
            });
          }
        }
      });
    }
  }

  return issues;
}

const issues = scanDirectory(BACKEND_API_DIR);

if (issues.length > 0) {
  console.error('❌ Authorization SSOT Violation(s) Found:\n');
  issues.forEach(issue => {
    console.error(`File: ${issue.file}:${issue.line}`);
    console.error(`Rule: ${issue.rule}`);
    console.error(`Code: ${issue.content}\n`);
  });
  process.exit(1);
} else {
  console.log('✅ Authorization SSOT Guardrail Check Passed: 0 raw role string violations.');
  process.exit(0);
}
