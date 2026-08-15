#!/usr/bin/env node

/**
 * 🛡️ Esparex Governance: PR Quality & Code Discipline Guard
 * 
 * Enforces `clean-code` and `code-quality` skill standards automatically:
 * 1. File Size Limits for NEW files (Component ≤250, Hook ≤200, Service ≤300, Utility ≤150)
 * 2. Ratchet guard for EXISTING modified files: oversized files cannot grow significantly (+5 lines max)
 * 3. Prevents technical debt expansion per principal engineering standards
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const FILE_LIMITS = [
  { type: 'Hook', max: 200, test: (f) => f.includes('/hooks/') || path.basename(f).startsWith('use') },
  { type: 'Service', max: 300, test: (f) => f.includes('Service') && !f.includes('/screens/') && !f.includes('/components/') },
  { type: 'Utility/Helper', max: 150, test: (f) => (f.includes('/utils/') || f.includes('/helpers/')) && !f.endsWith('.tsx') },
  { type: 'Component', max: 250, test: (f) => f.endsWith('.tsx') && !f.endsWith('.spec.tsx') && !f.endsWith('.test.tsx') && !f.includes('/app/') }
];

function getBaseRef() {
  const ghBase = process.env.GITHUB_BASE_REF;
  if (ghBase) return `origin/${ghBase}`;
  try {
    execSync('git rev-parse --verify origin/develop', { cwd: ROOT, stdio: 'ignore' });
    return 'origin/develop';
  } catch {
    return 'origin/main';
  }
}

function getMergeBase(baseRef) {
  try {
    return execSync(`git merge-base HEAD ${baseRef}`, { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    try {
      return execSync('git rev-parse HEAD~1', { cwd: ROOT, encoding: 'utf8' }).trim();
    } catch {
      return '';
    }
  }
}

function getFileStatus(baseSha) {
  try {
    const raw = execSync(`git diff --name-status ${baseSha}...HEAD`, { cwd: ROOT, encoding: 'utf8' }).trim();
    const map = new Map();
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue;
      const [status, filePath] = line.trim().split(/\s+/);
      map.set(filePath, status);
    }
    return map;
  } catch {
    return new Map();
  }
}

function getBaseFileLineCount(baseSha, relFile) {
  try {
    const content = execSync(`git show ${baseSha}:${relFile}`, { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    return content.split('\n').length;
  } catch {
    return 0;
  }
}

function run() {
  console.log('🛡️  Running PR Quality & Code Discipline Guard...');

  const baseRef = getBaseRef();
  const baseSha = getMergeBase(baseRef);

  if (!baseSha) {
    console.log('✅ Skipping PR quality guard (git base SHA could not be resolved).');
    return;
  }

  const statusMap = getFileStatus(baseSha);
  let violations = [];

  for (const [relFile, status] of statusMap.entries()) {
    const fullPath = path.join(ROOT, relFile);
    if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) continue;
    if (!/\.(ts|tsx)$/.test(relFile) || relFile.endsWith('.d.ts') || relFile.includes('node_modules')) continue;

    const currentLines = fs.readFileSync(fullPath, 'utf8').split('\n').length;

    for (const rule of FILE_LIMITS) {
      if (!rule.test(relFile)) continue;

      if (status === 'A') {
        // NEW FILE: Must strictly meet file size limit
        if (currentLines > rule.max) {
          violations.push({
            file: relFile,
            reason: `NEW ${rule.type} exceeds maximum size threshold (${currentLines} lines > max ${rule.max})`
          });
        }
      } else if (status === 'M') {
        // MODIFIED FILE: Baseline ratchet check (+5 lines tolerance for minor formatting/token refactors)
        const baseLines = getBaseFileLineCount(baseSha, relFile);
        const maxAllowed = Math.max(rule.max, baseLines + 5);
        if (currentLines > maxAllowed) {
          violations.push({
            file: relFile,
            reason: `Modified ${rule.type} grew beyond allowed baseline threshold (${baseLines} -> ${currentLines} lines, max allowed: ${maxAllowed}). Refactor into smaller sub-modules.`
          });
        }
      }
      break;
    }
  }

  if (violations.length > 0) {
    console.error(`❌ GOVERNANCE FAILURE: PR Code Quality violations detected (code-quality skill):`);
    for (const v of violations) {
      console.error(`   - ${v.file}: ${v.reason}`);
    }
    console.error(`   👉 Modularize oversized files into smaller components/hooks/services before merging.`);
    process.exit(1);
  }

  console.log(`✅ PR Quality Guard Passed: All new & modified files satisfy file size & ratchet rules.`);
}

run();
