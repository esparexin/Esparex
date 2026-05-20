#!/usr/bin/env node

/**
 * Documentation Governance Guard
 * 
 * Detects banned filename patterns, exact content duplicates,
 * and unregistered documentation files.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DOCS_ROOT = path.join(process.cwd(), 'docs');
const BANNED_PATTERNS = [/\bfinal\b/i, /\blatest\b/i, /\bupdated\b/i, /\bcopy\b/i, /\bnew\b/i, /\bdefinitive\b/i, /\bconsolidated\b/i, /\bbackup\b/i, /\bold\b/i, /\bdraft\b/i, /\btemp\b/i];
const REGISTRY_PATH = path.join(DOCS_ROOT, '00-index.md');

function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });
  return fileList;
}

function getRegistryFiles() {
  if (!fs.existsSync(REGISTRY_PATH)) return new Set();
  const content = fs.readFileSync(REGISTRY_PATH, 'utf8');
  const matches = content.matchAll(/`([^`]+\.md)`/g);
  return new Set([...matches].map(m => m[1]));
}

const allFiles = getFiles(process.cwd()).filter(f => 
  (f.endsWith('.md') || f.endsWith('.txt')) && 
  !f.includes('node_modules') && 
  !f.includes('.git') &&
  !f.includes('archive/') &&
  !f.includes('/build/') &&
  !f.includes('/intermediates/') &&
  fs.statSync(f).size > 0
);

const registryFiles = getRegistryFiles();
const fileHashes = new Map();
const violations = [];

allFiles.forEach(filePath => {
  const fileName = path.basename(filePath);
  const relativePath = path.relative(process.cwd(), filePath);

  // 1. Check for banned patterns in filename
  if (BANNED_PATTERNS.some(p => p.test(fileName))) {
    violations.push({ file: relativePath, reason: 'Banned filename pattern detected (e.g., "final", "latest", "copy")' });
  }

  // 2. Check for exact duplicates (hashes)
  const content = fs.readFileSync(filePath, 'utf8');
  const hash = crypto.createHash('md5').update(content).digest('hex');
  if (fileHashes.has(hash)) {
    violations.push({ file: relativePath, reason: `Exact content duplicate of ${fileHashes.get(hash)}` });
  } else {
    fileHashes.set(hash, relativePath);
  }

  // 3. Check if file is in registry (only for docs/ folder)
  if (relativePath.startsWith('docs/') && relativePath !== 'docs/00-index.md') {
    if (!registryFiles.has(relativePath)) {
      violations.push({ file: relativePath, reason: 'Documentation file not registered in docs/00-index.md' });
    }
  }
});

if (violations.length > 0) {
  console.error('❌ Documentation Governance Check Failed:');
  violations.forEach(v => {
    console.error(`  - ${v.file} :: ${v.reason}`);
  });
  process.exit(1);
}

console.log('✅ Documentation Governance Check Passed.');
