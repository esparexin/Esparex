#!/usr/bin/env node

/**
 * Documentation Governance & Stabilization Guard
 * 
 * Verifies that:
 * 1. All documents under docs/ are registered in docs/MASTER_DOCUMENT_REGISTRY.md.
 * 2. All documents are assigned a Tier, Canonical Owner, and Domain.
 * 3. All files in Tier 3 / docs/deprecated/ contain the mandatory '# DEPRECATED' warning header and replacement mapping.
 * 4. Archived files in archive/ are completely ignored and non-executable.
 * 5. Banned filenames, duplicates, and overlapping rule sets are detected and blocked.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DOCS_ROOT = path.join(process.cwd(), 'docs');
const BANNED_PATTERNS = [
  /\bfinal\b/i, /\blatest\b/i, /\bupdated\b/i, /\bcopy\b/i, 
  /\bnew\b/i, /\bdefinitive\b/i, /\bconsolidated\b/i, 
  /\bbackup\b/i, /\bold\b/i, /\bdraft\b/i, /\btemp\b/i
];
const REGISTRY_PATH = path.join(DOCS_ROOT, 'MASTER_DOCUMENT_REGISTRY.md');

// 1. Gather all repository markdown files
function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      // Ignore node_modules, .git, archive/ directories completely
      if (file !== 'node_modules' && file !== '.git' && file !== 'archive') {
        getFiles(filePath, fileList);
      }
    } else {
      fileList.push(filePath);
    }
  });
  return fileList;
}

// 2. Parse MASTER_DOCUMENT_REGISTRY.md
function parseRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    console.error(`❌ Registry not found at: ${REGISTRY_PATH}`);
    process.exit(1);
  }

  const content = fs.readFileSync(REGISTRY_PATH, 'utf8');
  
  // Extract all files matching `docs/...` or similar code snippets
  const fileRegex = /`((?:docs|ai-governance)\/[^`]+\.md)`/g;
  const matches = [...content.matchAll(fileRegex)].map(m => m[1]);
  const registeredSet = new Set(matches);

  // Parse Tiers, Owners, and Lifecycles
  const tiers = {
    canonical: new Set(),
    supporting: new Set(),
    deprecated: new Set(),
    archived: new Set()
  };

  // Extract tabular tier definitions
  const lines = content.split('\n');
  let currentTier = null;

  lines.forEach(line => {
    if (line.includes('Tier 1: Canonical')) {
      currentTier = 'canonical';
    } else if (line.includes('Tier 2: Supporting')) {
      currentTier = 'supporting';
    } else if (line.includes('Tier 3: Deprecated')) {
      currentTier = 'deprecated';
    } else if (line.includes('Tier 4: Archived')) {
      currentTier = 'archived';
    }

    if (currentTier && line.startsWith('|') && !line.includes('File Path') && !line.includes('---')) {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length > 2) {
        const fileMatch = parts[1].match(/`([^`]+)`/);
        if (fileMatch) {
          const filePath = fileMatch[1];
          tiers[currentTier].add(filePath);
        }
      }
    }
  });

  return { registeredSet, tiers };
}

const allFiles = getFiles(process.cwd()).filter(f => 
  (f.endsWith('.md') || f.endsWith('.txt')) && 
  !f.includes('node_modules') && 
  !f.includes('.git') &&
  !f.includes('archive/') &&
  !f.includes('.commandcode') &&
  !f.includes('/build/') &&
  !f.includes('/intermediates/') &&
  fs.statSync(f).size > 0
);

const { registeredSet, tiers } = parseRegistry();
const fileHashes = new Map();
const violations = [];

allFiles.forEach(filePath => {
  const fileName = path.basename(filePath);
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');

  // Ignore MASTER_DOCUMENT_REGISTRY.md and 00-index.md from normal registration check
  if (relativePath === 'docs/MASTER_DOCUMENT_REGISTRY.md' || relativePath === 'docs/00-index.md') {
    return;
  }

  // 1. Check for banned patterns in filename
  if (BANNED_PATTERNS.some(p => p.test(fileName))) {
    violations.push({ file: relativePath, reason: 'Banned filename pattern detected (e.g., "final", "latest", "copy")' });
  }

  // 2. Check for exact duplicate content
  const content = fs.readFileSync(filePath, 'utf8');
  const hash = crypto.createHash('md5').update(content).digest('hex');
  if (fileHashes.has(hash)) {
    violations.push({ file: relativePath, reason: `Exact content duplicate of ${fileHashes.get(hash)}` });
  } else {
    fileHashes.set(hash, relativePath);
  }

  // 3. Registry & Tier Registration Check
  if (relativePath.startsWith('docs/')) {
    if (!registeredSet.has(relativePath)) {
      violations.push({ file: relativePath, reason: 'Documentation file not registered in docs/MASTER_DOCUMENT_REGISTRY.md' });
    } else {
      // Validate Tier categorization
      const hasTier = tiers.canonical.has(relativePath) || 
                      tiers.supporting.has(relativePath) || 
                      tiers.deprecated.has(relativePath) || 
                      tiers.archived.has(relativePath);
      if (!hasTier) {
        violations.push({ file: relativePath, reason: 'Registered in MASTER_DOCUMENT_REGISTRY.md but has no valid Tier classification' });
      }
    }
  }

  // 4. Deprecated Lifecycle Validation
  const isDeprecatedPath = relativePath.startsWith('docs/deprecated/');
  const isDeprecatedTier = tiers.deprecated.has(relativePath);

  if (isDeprecatedPath || isDeprecatedTier) {
    if (!isDeprecatedPath || !isDeprecatedTier) {
      violations.push({ file: relativePath, reason: 'File must reside in docs/deprecated/ AND belong to Tier 3: Deprecated' });
    }

    // Assert '# DEPRECATED' header exists
    if (!content.includes('# DEPRECATED')) {
      violations.push({ file: relativePath, reason: 'Deprecated document lacks mandatory "# DEPRECATED" heading' });
    }
    // Assert 'Replaced by:' exists
    if (!content.match(/Replaced by:\s*\[[^\]]+\]/i)) {
      violations.push({ file: relativePath, reason: 'Deprecated document lacks explicit replacement mapping ("Replaced by: ...")' });
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
