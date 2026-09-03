#!/usr/bin/env node

/**
 * 🛡️ Esparex Governance: PR Quality & Code Discipline Guard
 * 
 * Enforces `clean-code` and `code-quality` skill standards automatically:
 * 1. File Size Limits for NEW files (Component ≤250, Hook ≤200, Service ≤300, Utility ≤150)
 * 2. Ratchet guard for EXISTING modified files: oversized files cannot grow significantly (+5 lines max)
 * 3. Prevents technical debt expansion per principal engineering standards
 * 
 * MODES:
 * - Pre-commit mode (`--staged`): Evaluates exactly what is in the Git staging index (`--cached`).
 * - Branch / CI mode (default): Evaluates all commits on the branch against integration base.
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

function parseStatusOutput(rawOutput) {
  const map = new Map();
  for (const line of rawOutput.split('\n')) {
    if (!line.trim()) continue;
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 2) {
      const status = parts[0];
      const filePath = parts[parts.length - 1]; // Handles renames R100 old new -> new
      const oldPath = (status.charAt(0) === 'R' && parts.length >= 3) ? parts[1] : filePath;
      map.set(filePath, { status: status.charAt(0), oldPath }); // Normalized to A, M, D, R, etc.
    }
  }
  return map;
}

function getStagedFileStatus() {
  try {
    const raw = execSync('git diff --cached --name-status', { cwd: ROOT, encoding: 'utf8' }).trim();
    return parseStatusOutput(raw);
  } catch {
    return new Map();
  }
}

function getBranchFileStatus(baseSha) {
  try {
    const raw = execSync(`git diff --name-status ${baseSha}...HEAD`, { cwd: ROOT, encoding: 'utf8' }).trim();
    return parseStatusOutput(raw);
  } catch {
    return new Map();
  }
}

function getGitFileLineCount(gitRef, relFile) {
  try {
    const content = execSync(`git show ${gitRef}:${relFile}`, { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    return content.split('\n').length;
  } catch {
    return 0;
  }
}

function getStagedFileLineCount(relFile) {
  try {
    const content = execSync(`git show :${relFile}`, { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    return content.split('\n').length;
  } catch {
    const fullPath = path.join(ROOT, relFile);
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, 'utf8').split('\n').length;
    }
    return 0;
  }
}

function run() {
  const isStagedMode = process.argv.includes('--staged');
  console.log(`🛡️  Running PR Quality & Code Discipline Guard [Mode: ${isStagedMode ? 'Pre-Commit (Staged Index)' : 'Branch / CI Evaluation'}]...`);

  let statusMap;
  let baseRefName = '';
  let getBaseLineCount;

  if (isStagedMode) {
    statusMap = getStagedFileStatus();
    baseRefName = 'HEAD';
    getBaseLineCount = (relFile) => getGitFileLineCount('HEAD', relFile);
  } else {
    const baseRef = getBaseRef();
    const baseSha = getMergeBase(baseRef);

    if (!baseSha) {
      console.log('⚠️  Skipping PR quality guard: git merge-base could not be resolved.');
      return;
    }

    baseRefName = baseRef;
    statusMap = getBranchFileStatus(baseSha);
    getBaseLineCount = (relFile) => getGitFileLineCount(baseSha, relFile);
  }

  let auditedCount = 0;
  let violations = [];

  for (const [relFile, entry] of statusMap.entries()) {
    const status = typeof entry === 'string' ? entry : entry.status;
    const oldPath = typeof entry === 'string' ? relFile : entry.oldPath;
    if (status === 'D') continue; // Deleted files are ignored
    if (!/\.(ts|tsx)$/.test(relFile) || relFile.endsWith('.d.ts') || relFile.includes('node_modules')) continue;

    const matchedRule = FILE_LIMITS.find((rule) => rule.test(relFile));
    if (!matchedRule) continue;

    auditedCount++;

    const currentLines = isStagedMode ? getStagedFileLineCount(relFile) : (() => {
      const fullPath = path.join(ROOT, relFile);
      return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8').split('\n').length : 0;
    })();

    if (status === 'A') {
      // NEW FILE: Must strictly meet file size limit
      if (currentLines > matchedRule.max) {
        violations.push({
          file: relFile,
          reason: `NEW ${matchedRule.type} exceeds maximum size threshold (${currentLines} lines > max ${matchedRule.max})`
        });
      }
    } else if (status === 'M' || status === 'R') {
      // MODIFIED FILE: Baseline ratchet check (+5 lines tolerance for formatting/tokens)
      const baseLines = getBaseLineCount(oldPath);
      const maxAllowed = Math.max(matchedRule.max, baseLines + 5);
      if (currentLines > maxAllowed) {
        violations.push({
          file: relFile,
          reason: `Modified ${matchedRule.type} grew beyond allowed baseline threshold (${baseLines} -> ${currentLines} lines, max allowed: ${maxAllowed} [vs ${baseRefName}]). Refactor into smaller sub-modules.`
        });
      }
    }
  }

  if (violations.length > 0) {
    console.error(`❌ GOVERNANCE FAILURE: PR Code Quality violations detected (code-quality skill):`);
    for (const v of violations) {
      console.error(`   - ${v.file}: ${v.reason}`);
    }
    console.error(`   👉 Modularize oversized files into smaller components/hooks/services before proceeding.`);
    process.exit(1);
  }

  if (auditedCount === 0) {
    console.log(`ℹ️  PR Quality Guard: 0 matching TypeScript files to evaluate in ${isStagedMode ? 'staging index' : `diff vs ${baseRefName}`}. (Pass)`);
  } else {
    console.log(`✅ PR Quality Guard Passed: Audited ${auditedCount} file(s) — all satisfy file size limits and baseline ratchet rules.`);
  }
}

run();
