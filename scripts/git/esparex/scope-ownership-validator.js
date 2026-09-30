#!/usr/bin/env node
/**
 * SCOPE-001 — Narrow-Scope Ownership & Blast-Radius Control.
 *
 * Mechanical enforcement for AGENTS.md §25 (pointer only — lifecycle lives in
 * `.agents/workflow/AI_WORKFLOW.md`, owners in
 * `.agents/governance/CANONICAL_OWNERSHIP_REGISTRY.json`, contract + matrix in
 * `.agents/policy_engine/POLICY_ENGINE.json`).
 *
 * Compares DECLARED SCOPE vs ACTUAL DIFF on the branch merge-base and blocks:
 *  1. Mechanically provable second owners (scroll lock, keyboard compensator,
 *     auth-sheet owner, OTP/retry matcher, removed overlay API, fullscreen
 *     contract kill, sheetScrollLock resurrection).
 *  2. High-risk shared files touched without ownership/blast-radius evidence.
 *  3. Actual diff exceeding the declared scope (undeclared high-risk or new files).
 *
 * Never blocks on file counts. Docs/evidence-only diffs pass. Repeat touches
 * warn (workflow-level re-audit), they do not fail here.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { runStandalone, ROOT } = require('../shared');

const META = { id: 'SCOPE-001', name: 'Scope, Ownership & Blast-Radius Control', version: '1.0.0', category: 'Governance' };

function loadRegistry() {
  try {
    const raw = fs.readFileSync(path.join(ROOT, '.agents/governance/CANONICAL_OWNERSHIP_REGISTRY.json'), 'utf8');
    const data = JSON.parse(raw);
    return {
      behaviorOwnership: data.behaviorOwnership || {},
      highRiskPaths: Array.isArray(data.highRiskPaths) ? data.highRiskPaths : [],
    };
  } catch {
    return { behaviorOwnership: {}, highRiskPaths: [] };
  }
}

function globToRegExp(glob) {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '\u0000').replace(/\*/g, '[^/]*').replace(/\u0000/g, '.*');
  return new RegExp(`^${escaped}$`);
}

function matchHighRisk(relPath, highRiskPaths) {
  const normalized = relPath.replace(/\\/g, '/');
  return highRiskPaths.some((pattern) => {
    try {
      return globToRegExp(pattern).test(normalized);
    } catch {
      return false;
    }
  });
}

function isTestPath(relPath) {
  return (
    relPath.includes('__tests__') ||
    relPath.includes('__mocks__') ||
    relPath.endsWith('.spec.ts') ||
    relPath.endsWith('.spec.tsx') ||
    relPath.endsWith('.test.ts') ||
    relPath.endsWith('.test.tsx')
  );
}

function isDocsOnlyChange(relPath) {
  return /\.md$/.test(relPath) || /^(audit-reports|governance\/(evidence|waivers)|\.agents\/logs)\//.test(relPath);
}

/**
 * Scan ADDED diff lines of one file for mechanically provable second owners.
 * Returns violation strings. Pure function — covered by scripts/__tests__.
 */
function scanAddedLines(relPath, addedLines) {
  const violations = [];
  if (isTestPath(relPath)) return violations;
  const text = addedLines.join('\n');
  const inWeb = relPath.startsWith('apps/web/');
  const inUi = relPath.startsWith('packages/ui/');

  // 1. Second body scroll-lock writer (owner: Sheet/Radix RemoveScroll).
  if ((inWeb || inUi) && /body\.style\.position/.test(text) && /fixed/.test(text)) {
    violations.push(`second scroll-lock writer in ${relPath} (owner: packages/ui/src/feedback/Sheet.tsx via Radix RemoveScroll)`);
  }
  // 2. Second keyboard-height compensator (owners: Sheet.tsx + useVisualViewport.ts).
  if (
    text.includes('--keyboard-height') &&
    relPath !== 'packages/ui/src/feedback/Sheet.tsx' &&
    relPath !== 'apps/web/src/hooks/useVisualViewport.ts'
  ) {
    violations.push(`second keyboard-height compensator in ${relPath} (owners: Sheet.tsx + useVisualViewport.ts)`);
  }
  // 3. Second auth-sheet owner (owner: AuthModalContext).
  if (/openSheet\(\s*['"]auth['"]|registerSheet\(\s*['"]auth['"]/.test(text) && relPath !== 'apps/web/src/context/AuthModalContext.tsx') {
    violations.push(`second auth-sheet owner in ${relPath} (owner: apps/web/src/context/AuthModalContext.tsx)`);
  }
  // 4. Second OTP/retry matcher (owner: lib/api/client.ts canonical matcher).
  if (inWeb && text.includes('auth/send-otp') && relPath !== 'apps/web/src/lib/api/client.ts') {
    violations.push(`second OTP/retry matcher in ${relPath} (owner: apps/web/src/lib/api/client.ts)`);
  }
  // 5. Removed overlay API reintroduced.
  if (
    text.includes('overlayClassName') &&
    (relPath === 'packages/ui/src/feedback/Sheet.tsx' || relPath === 'apps/web/src/components/auth/AuthModal.tsx')
  ) {
    violations.push(`removed overlay API reintroduced in ${relPath} (deleted: overlayClassName masked bleed)`);
  }
  // 6. Fullscreen contract kill (destroys Sheet side=bottom keyboard contract).
  if (relPath === 'apps/web/src/components/auth/AuthModal.tsx' && /fixed inset-0/.test(text)) {
    violations.push('fullscreen override in AuthModal.tsx kills the Sheet side=bottom keyboard contract');
  }
  return violations;
}

function scanNewFilePath(relPath) {
  if (/(^|\/)sheetScrollLock\.(ts|tsx|js)$/.test(relPath)) {
    return `resurrected competing scroll-lock module ${relPath} (owner: Radix RemoveScroll via Sheet.tsx)`;
  }
  return null;
}

/**
 * Parse a `Declared Files:` list from scope evidence text. Returns array of
 * declared paths (may be empty when no declaration present). Pure function.
 */
function parseDeclaredScope(evidenceText) {
  const declared = [];
  const lines = String(evidenceText || '').split('\n');
  let inSection = false;
  for (const line of lines) {
    if (/declared files\s*:/i.test(line)) {
      inSection = true;
      const inline = line.split(/declared files\s*:/i)[1] || '';
      inline.split(',').map((s) => s.trim()).filter(Boolean).forEach((f) => declared.push(f));
      continue;
    }
    if (inSection) {
      const m = line.match(/^\s*[-*]\s+(\S+)/);
      if (m) {
        declared.push(m[1].replace(/[`"'.,;]+$/g, ''));
      } else if (line.trim() === '' || /^\s{0,3}#{1,6}\s/.test(line)) {
        if (/^\s{0,3}#{1,6}\s/.test(line)) inSection = false;
      } else if (/:\s*$/.test(line)) {
        inSection = false;
      }
    }
  }
  return declared;
}

function declaresPath(declared, relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  return declared.some((d) => {
    const dd = String(d).replace(/\\/g, '/').replace(/^[./]+/, '');
    return normalized === dd || normalized.endsWith(`/${dd}`) || dd === path.basename(normalized);
  });
}

function hasScopeEvidence(evidenceText) {
  const t = String(evidenceText || '').toLowerCase();
  const compact =
    t.includes('scope-contract') && t.includes('high-risk') && t.includes('blast') && t.includes('regress');
  const legacy = t.includes('phase 0 search executed') && t.includes('ssot') && t.includes('affected');
  return compact || legacy;
}

function hasScopeOverride(evidenceText) {
  const t = String(evidenceText || '').toLowerCase();
  return t.includes('scope-override') && t.includes('why_this_owner') && t.includes('regression');
}

/**
 * Evaluate declared-vs-actual scope. Pure function — covered by scripts/__tests__.
 */
function evaluateScope({ changedFiles, newFiles, highRiskTouched, evidenceText }) {
  const errors = [];
  const warnings = [];
  if (hasScopeOverride(evidenceText)) {
    return { errors, warnings, note: 'scope override evidence present' };
  }
  if (highRiskTouched.length === 0) return { errors, warnings, note: 'no high-risk files touched' };
  if (!hasScopeEvidence(evidenceText)) {
    errors.push(
      `High-risk shared files touched without ownership/blast-radius evidence: ${highRiskTouched.join(', ')}. ` +
        `Add a SCOPE-CONTRACT trailer (request, declared files, high-risk touched, ownership evidence, blast radius, regression rows) to the PR body or branch commit messages.`
    );
    return { errors, warnings, note: 'evidence missing' };
  }
  const declared = parseDeclaredScope(evidenceText);
  if (declared.length === 0) return { errors, warnings, note: 'evidence present, no declared file list to diff against' };
  const undeclared = [...highRiskTouched, ...newFiles.filter((f) => /\.(ts|tsx)$/.test(f))].filter((f) => !declaresPath(declared, f));
  if (undeclared.length > 0) {
    errors.push(`Actual diff exceeds declared scope. Undeclared shared/new files: ${undeclared.join(', ')}. Update the declared scope or revert.`);
  }
  return { errors, warnings, note: 'evaluated against declared scope' };
}

/**
 * Repeat-touch signal: same high-risk file changed in >=3 branch commits
 * without new root-cause evidence. Warning only — re-audit is workflow-level.
 */
function detectOscillation(fileTouchCounts) {
  const warnings = [];
  for (const [file, count] of Object.entries(fileTouchCounts)) {
    if (count >= 3) {
      warnings.push(
        `Repeat-touch signal: ${file} changed in ${count} branch commits. Return to Phase 7 / Phase 2b ownership and root-cause analysis before further edits (oscillation control).`
      );
    }
  }
  return warnings;
}

function getBaseRef() {
  for (const ref of ['origin/develop', 'origin/main']) {
    try {
      execSync(`git rev-parse --verify ${ref}`, { cwd: ROOT, stdio: 'ignore' });
      try {
        return execSync(`git merge-base HEAD ${ref}`, { cwd: ROOT, encoding: 'utf8' }).trim();
      } catch {
        continue;
      }
    } catch {
      continue;
    }
  }
  try {
    return execSync('git rev-parse HEAD~1', { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function run(val) {
  const { highRiskPaths } = loadRegistry();
  let baseSha = '';
  try {
    baseSha = getBaseRef();
  } catch {
    baseSha = '';
  }
  if (!baseSha) {
    val.info('SCOPE-001 skipped: merge base could not be resolved.');
    return;
  }

  let statusOut = '';
  try {
    statusOut = execSync(`git diff --name-status ${baseSha}...HEAD`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  } catch {
    val.info('SCOPE-001 skipped: branch diff unavailable.');
    return;
  }

  const changedFiles = [];
  const newFiles = [];
  for (const line of statusOut.split('\n')) {
    if (!line.trim()) continue;
    const parts = line.trim().split(/\s+/);
    const status = parts[0].charAt(0);
    const filePath = parts[parts.length - 1];
    if (status === 'D') continue;
    const rel = filePath.replace(/\\/g, '/');
    changedFiles.push(rel);
    if (status === 'A') newFiles.push(rel);
  }

  if (changedFiles.length === 0) {
    val.info('SCOPE-001: no changed files in branch diff.');
    return;
  }
  if (changedFiles.every(isDocsOnlyChange)) {
    val.info('SCOPE-001: docs/evidence-only change — scope control not applicable.');
    return;
  }

  const highRiskTouched = changedFiles.filter((f) => matchHighRisk(f, highRiskPaths));

  // Second-owner scan over added lines.
  let addedDiff = '';
  try {
    addedDiff =
      execSync(`git diff --unified=0 ${baseSha}...HEAD -- '*.ts' '*.tsx' '*.css'`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }) || '';
  } catch {
    addedDiff = '';
  }
  const addedByFile = new Map();
  let currentFile = '';
  for (const line of addedDiff.split('\n')) {
    const fileMatch = line.match(/^\+\+\+ b\/(.+)$/);
    if (fileMatch) {
      currentFile = fileMatch[1].replace(/\\/g, '/');
      if (!addedByFile.has(currentFile)) addedByFile.set(currentFile, []);
      continue;
    }
    if (line.startsWith('+') && !line.startsWith('+++') && currentFile) {
      addedByFile.get(currentFile).push(line.slice(1));
    }
  }
  for (const [rel, addedLines] of addedByFile.entries()) {
    for (const violation of scanAddedLines(rel, addedLines)) {
      val.error(`NEW Scope Violation [second owner]: ${violation}`);
    }
  }
  for (const rel of newFiles) {
    const resurrection = scanNewFilePath(rel);
    if (resurrection) val.error(`NEW Scope Violation [second owner]: ${resurrection}`);
  }

  // Declared-vs-actual scope.
  let evidenceText = process.env.PR_BODY || process.env.GITHUB_PR_BODY || '';
  try {
    const bodies = execSync(`git log --format=%B ${baseSha}..HEAD`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
    evidenceText = `${evidenceText}\n${bodies}`;
  } catch {
    // commit bodies unavailable — PR_BODY alone still counts
  }
  const { errors, warnings } = evaluateScope({ changedFiles, newFiles, highRiskTouched, evidenceText });
  for (const e of errors) val.error(`NEW Scope Violation [scope evidence]: ${e}`);
  for (const w of warnings) val.warning(w);

  // Oscillation signal (warning only).
  try {
    const names = execSync(`git log --name-only --format= ${baseSha}..HEAD`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
    const counts = {};
    for (const name of names.split('\n').map((s) => s.trim()).filter(Boolean)) {
      const rel = name.replace(/\\/g, '/');
      if (matchHighRisk(rel, highRiskPaths)) counts[rel] = (counts[rel] || 0) + 1;
    }
    for (const w of detectOscillation(counts)) val.warning(w);
  } catch {
    // oscillation signal best-effort only
  }

  if (val.errors.length === 0 && highRiskTouched.length > 0) {
    val.info(`SCOPE-001: high-risk files evidenced (${highRiskTouched.join(', ')})`);
  } else if (val.errors.length === 0) {
    val.info('SCOPE-001: no high-risk scope violations (no shared owners touched without evidence)');
  }
}

if (require.main === module) {
  runStandalone(META, run);
}
module.exports = {
  meta: META,
  run,
  matchHighRisk,
  scanAddedLines,
  scanNewFilePath,
  parseDeclaredScope,
  evaluateScope,
  detectOscillation,
  hasScopeEvidence,
  hasScopeOverride,
};
