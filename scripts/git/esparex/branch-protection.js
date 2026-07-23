#!/usr/bin/env node
const { execSync } = require('child_process');
const { Validation, runStandalone, ROOT } = require('../shared');

const META = { id: 'BRANCH-001', name: 'Branch Protection', version: '1.0.0', category: 'Governance' };
const PROTECTED_BRANCHES = ['main', 'develop', 'live'];

function run(val) {
  const branch = (() => {
    try {
      return execSync('git symbolic-ref --short HEAD', { cwd: ROOT, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    } catch { return ''; }
  })();

  if (process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true") {
    val.info("CI environment detected — skipping direct branch protection check.");
    return;
  }

  if (!branch) {
    val.info('Could not determine current branch.');
    return;
  }

  if (PROTECTED_BRANCHES.includes(branch)) {
    val.error(`Direct push to protected branch "${branch}" is not allowed. Use a feature branch and PR.`);
  }
}

if (require.main === module) {
  runStandalone(META, run);
}
module.exports = { meta: META, run };
