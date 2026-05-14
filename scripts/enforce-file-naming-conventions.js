#!/usr/bin/env node

/**
 * Enforce file naming conventions
 * 
 * - React components (.tsx) -> PascalCase
 * - Services, Controllers, Validators, Utils, Helpers (.ts) -> camelCase
 * - Models (.ts) -> PascalCase (Singular)
 */

const fs = require('fs');
const path = require('path');

const SCAN_DIRS = [
  'apps/admin/src',
  'apps/web/src',
  'backend/user/src',
  'core/src',
  'shared/src'
];

const EXCLUDED_FILES = new Set(['index.ts', 'index.tsx', 'app.ts', 'layout.tsx', 'page.tsx', 'loading.tsx', 'error.tsx', 'not-found.tsx']);
const EXCLUDED_PATTERNS = [/\.test\.ts$/, /\.test\.tsx$/, /\.validator\.ts$/, /\.schema\.ts$/];

function isPascalCase(name) {
  return /^[A-Z][a-zA-Z0-9]+$/.test(name);
}

function isCamelCase(name) {
  return /^[a-z][a-zA-Z0-9]+$/.test(name);
}

function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.next', 'build', 'coverage', '__tests__', 'ui', 'lib'].includes(entry.name)) continue;
      walk(fullPath, fileList);
    } else if (entry.isFile()) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const violations = [];

SCAN_DIRS.forEach(root => {
  const files = walk(path.join(process.cwd(), root));
  files.forEach(file => {
    const ext = path.extname(file);
    const fileNameFull = path.basename(file, ext);
    const fileName = fileNameFull.split('.')[0];
    const relativePath = path.relative(process.cwd(), file);

    if (EXCLUDED_FILES.has(path.basename(file)) || 
        EXCLUDED_PATTERNS.some(p => p.test(path.basename(file))) ||
        fileNameFull === 'shared' ||
        fileNameFull === 'global-error' ||
        fileNameFull.startsWith('with')
    ) return;

    if (ext === '.tsx') {
      // Components should be PascalCase
      if (!isPascalCase(fileName)) {
        violations.push({ file: relativePath, reason: `React component (.tsx) must be PascalCase. Found: ${fileNameFull}` });
      }
    } else if (ext === '.ts') {
      // Models are PascalCase, others are camelCase
      if (relativePath.includes('/models/')) {
        const isCore = relativePath.startsWith('core/');
        if (!isPascalCase(fileName) && !isCore) {
          violations.push({ file: relativePath, reason: `Model file must be PascalCase. Found: ${fileNameFull}` });
        }
      } else if (relativePath.includes('/controllers/') || relativePath.includes('/services/') || relativePath.includes('/utils/') || relativePath.includes('/helpers/') || relativePath.includes('/validators/')) {
        // Core often uses PascalCase for services/utils, while backend uses camelCase
        const isCore = relativePath.startsWith('core/');
        if (isCore) {
          if (!isPascalCase(fileName) && !isCamelCase(fileName)) {
            violations.push({ file: relativePath, reason: `Core service/util must be PascalCase or camelCase. Found: ${fileName}` });
          }
        } else if (!isCamelCase(fileName)) {
          violations.push({ file: relativePath, reason: `Service/Controller/Util/etc must be camelCase. Found: ${fileName}` });
        }
      }
    }
  });
});

if (violations.length > 0) {
  console.error('❌ Naming Convention Check Failed:');
  violations.forEach(v => {
    console.error(`  - ${v.file} :: ${v.reason}`);
  });
  process.exit(1);
}

console.log('✅ Naming Convention Check Passed.');
