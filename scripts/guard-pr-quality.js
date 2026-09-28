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
  { type: 'Component', max: 250, test: (f) => f.endsWith('.tsx') && !f.endsWith('.spec.tsx') && !f.endsWith('.test.tsx') && !f.includes('/app/') },
  { type: 'Hook', max: 200, test: (f) => f.includes('/hooks/') || /^use[A-Z]/.test(path.basename(f)) },
  { type: 'Service', max: 300, test: (f) => f.includes('Service') && !f.includes('/screens/') && !f.includes('/components/') },
  { type: 'Controller', max: 200, test: (f) => f.includes('Controller') && !f.includes('/screens/') && !f.includes('/components/') },
  { type: 'Utility/Helper', max: 150, test: (f) => (f.includes('/utils/') || f.includes('/helpers/')) && !f.endsWith('.tsx') },
];

const ts = require('typescript');

function evaluateCodeComplexity(relFile, content) {
  const issues = [];
  let sourceFile;
  try {
    sourceFile = ts.createSourceFile(relFile, content, ts.ScriptTarget.Latest, true);
  } catch {
    return issues;
  }

  function isControlFlow(node) {
    return ts.isIfStatement(node) ||
      ts.isForStatement(node) ||
      ts.isForInStatement(node) ||
      ts.isForOfStatement(node) ||
      ts.isWhileStatement(node) ||
      ts.isDoStatement(node) ||
      ts.isSwitchStatement(node) ||
      ts.isCatchClause(node);
  }

  const MAX_CONTROL_FLOW_DEPTH = 5;
  let maxReported = false;

  function walk(node, depth) {
    const nextDepth = isControlFlow(node) ? depth + 1 : depth;
    if (nextDepth > MAX_CONTROL_FLOW_DEPTH && isControlFlow(node) && !maxReported) {
      const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      issues.push(`Deep control-flow nesting depth (${nextDepth} levels) detected at line ${line + 1}. Refactor nested control flow.`);
      maxReported = true;
    }

    // Check excessive positional parameter count (>5 parameters without destructuring DTO)
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node) ||
      ts.isMethodDeclaration(node)
    ) {
      if (node.parameters && node.parameters.length > 5) {
        const hasDestructuring = node.parameters.some((p) => ts.isObjectBindingPattern(p.name));
        if (!hasDestructuring) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          issues.push(`Excessive positional parameters (${node.parameters.length} > 5) at line ${line + 1}. Pass a typed parameter DTO per Zero Primitive Obsession.`);
        }
      }
    }

    ts.forEachChild(node, (child) => walk(child, nextDepth));
  }

  walk(sourceFile, 0);
  return issues;
}

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
  const isAbsoluteMode = process.argv.includes('--absolute');
  console.log(`🛡️  Running PR Quality & Code Discipline Guard [Mode: ${isAbsoluteMode ? 'Absolute Repository Audit' : isStagedMode ? 'Pre-Commit (Staged Index)' : 'Branch / CI Evaluation'}]...`);

  let statusMap;
  let baseRefName = '';
  let getBaseLineCount = () => 0;
  let baseSha = '';

  if (isAbsoluteMode) {
    baseRefName = 'absolute';
  } else if (isStagedMode) {
    statusMap = getStagedFileStatus();
    baseRefName = 'HEAD';
    getBaseLineCount = (relFile) => getGitFileLineCount('HEAD', relFile);
  } else {
    const baseRef = getBaseRef();
    baseSha = getMergeBase(baseRef);

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
  let absoluteWarnings = [];

  if (isAbsoluteMode) {
    const { execSync: _exec } = require('child_process');
    try {
      const out = _exec('git ls-files "*.ts" "*.tsx"', { cwd: ROOT, encoding: 'utf8' });
      statusMap = new Map(out.split('\n').filter(Boolean).map((f) => [f, { status: 'M', oldPath: f }]));
      getBaseLineCount = () => 0;
    } catch {
      console.log('⚠️  Absolute mode: could not list tracked files.');
      return;
    }
  }

  for (const [relFile, entry] of statusMap.entries()) {
    const status = typeof entry === 'string' ? entry : entry.status;
    const _oldPath = typeof entry === 'string' ? relFile : entry.oldPath;
    if (status === 'D') continue; // Deleted files are ignored
    if (!/\.(ts|tsx)$/.test(relFile) || relFile.endsWith('.d.ts') || relFile.includes('node_modules')) continue;

    const matchedRule = FILE_LIMITS.find((rule) => rule.test(relFile));
    if (!matchedRule) continue;

    auditedCount++;

    const currentLines = isStagedMode ? getStagedFileLineCount(relFile) : (() => {
      const fullPath = path.join(ROOT, relFile);
      return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8').split('\n').length : 0;
    })();

    // Evaluate semantic complexity for all modified and added TypeScript files
    const fileContent = (() => {
      const fullPath = path.join(ROOT, relFile);
      return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : '';
    })();
    const complexityIssues = evaluateCodeComplexity(relFile, fileContent);
    for (const issue of complexityIssues) {
      violations.push({ file: relFile, reason: issue });
    }

    if (status === 'A') {
      // NEW FILE: Must strictly meet file size limit
      if (currentLines > matchedRule.max) {
        violations.push({
          file: relFile,
          reason: `NEW ${matchedRule.type} exceeds maximum size threshold (${currentLines} lines > max ${matchedRule.max})`
        });
      }
    } else if (status === 'M' || status === 'R') {
      // MODIFIED FILE: baseline + 5 ratchet (AGENTS.md §7). Absolute cap still reported.
      const baseLines = getBaseLineCount(relFile);
      const ratchetLimit = baseLines > 0 ? baseLines + 5 : matchedRule.max;
      if (baseLines > 0 && currentLines > ratchetLimit) {
        violations.push({
          file: relFile,
          reason: `Modified ${matchedRule.type} grew beyond ratchet (+5): baseline ${baseLines} → ${currentLines} (limit ${ratchetLimit}, absolute max ${matchedRule.max}). Extract sub-modules before adding logic.`
        });
      }
      if (currentLines > matchedRule.max) {
        absoluteWarnings.push({
          file: relFile,
          reason: `${matchedRule.type} exceeds absolute max (${currentLines} > ${matchedRule.max}). Pre-existing debt: do not grow further; schedule responsibility-based split.`
        });
      }
    }
  }

  if (isAbsoluteMode && absoluteWarnings.length > 0) {
    console.error(`❌ GOVERNANCE FAILURE (absolute): ${absoluteWarnings.length} file(s) exceed AGENTS.md §7 absolute limits:`);
    for (const v of absoluteWarnings.slice(0, 50)) {
      console.error(`   - ${v.file}: ${v.reason}`);
    }
    if (absoluteWarnings.length > 50) console.error(`   ... and ${absoluteWarnings.length - 50} more`);
    process.exit(1);
  }

  if (violations.length > 0) {
    console.error(`❌ GOVERNANCE FAILURE: PR Code Quality violations detected (code-quality skill):`);
    for (const v of violations) {
      console.error(`   - ${v.file}: ${v.reason}`);
    }
    console.error(`   👉 Modularize oversized files into smaller components/hooks/services before proceeding.`);
    process.exit(1);
  }

  if (absoluteWarnings.length > 0 && !isAbsoluteMode) {
    console.warn(`⚠️  Pre-existing absolute debt (non-blocking in branch mode, blocking with --absolute): ${absoluteWarnings.length} file(s). Run with --absolute for full list.`);
    for (const v of absoluteWarnings.slice(0, 10)) {
      console.warn(`   - ${v.file}: ${v.reason}`);
    }
  }

  if (auditedCount === 0) {
    console.log(`ℹ️  PR Quality Guard: 0 matching TypeScript files to evaluate in ${isAbsoluteMode ? 'absolute repository scan' : isStagedMode ? 'staging index' : `diff vs ${baseRefName}`}. (Pass)`);
  } else {
    console.log(`✅ PR Quality Guard Passed: Audited ${auditedCount} file(s) — all satisfy file size limits and baseline ratchet rules.`);
  }
}

run();
