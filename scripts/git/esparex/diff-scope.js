#!/usr/bin/env node
/**
 * Shared diff-scope helper for staged-only validators (DECISION-GATE C-4).
 *
 * Staged-only validators must not be vacuous:
 *  - pre-commit / local: diff the staged index (`git diff --cached`)
 *  - CI (CI=true): diff the merge-base (`git merge-base HEAD <base>`)..HEAD,
 *    because CI checkouts have no staged index.
 *
 * Base resolution mirrors scripts/enforce-no-new-unused-imports.js:
 * GITHUB_BASE_REF -> origin/develop -> origin/main.
 */
'use strict';

const { execSync } = require('child_process');

function run(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return '';
  }
}

function resolveBaseRef(cwd) {
  const ghBase = process.env.GITHUB_BASE_REF;
  if (ghBase) return `origin/${ghBase}`;
  if (run('git rev-parse --verify origin/develop', cwd)) return 'origin/develop';
  if (run('git rev-parse --verify origin/main', cwd)) return 'origin/main';
  return '';
}

function resolveMergeBase(cwd) {
  const baseRef = resolveBaseRef(cwd);
  if (baseRef) {
    const sha = run(`git merge-base HEAD ${baseRef}`, cwd);
    if (sha) return sha;
  }
  return run('git rev-parse HEAD~1', cwd);
}

/**
 * Returns the list of changed files relevant to the validator.
 * In CI: merge-base diff. Otherwise: staged index (pre-commit).
 */
function getChangedFiles(cwd, diffFilter = 'ACMR') {
  const isCI = process.env.CI === 'true';
  let cmd;
  if (isCI) {
    const baseSha = resolveMergeBase(cwd);
    if (!baseSha) return { files: [], scope: 'ci:merge-base (unresolved)' };
    cmd = `git diff --name-only --diff-filter=${diffFilter} ${baseSha}...HEAD`;
    const out = run(cmd, cwd);
    return { files: out ? out.split('\n').filter(Boolean) : [], scope: `ci:merge-base (${baseSha.slice(0, 8)})...HEAD` };
  }
  cmd = `git diff --cached --name-only --diff-filter=${diffFilter}`;
  const out = run(cmd, cwd);
  return { files: out ? out.split('\n').filter(Boolean) : [], scope: 'staged' };
}

module.exports = { getChangedFiles, resolveBaseRef, resolveMergeBase };
