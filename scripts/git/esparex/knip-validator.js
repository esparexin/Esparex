#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { runStandalone, ROOT } = require('../shared');

const META = { id: 'KNIP-001', name: 'Knip Unused & Duplicate Export Baseline', version: '1.0.0', category: 'Architecture' };
const BASELINE_PATH = path.join(ROOT, 'scripts/policy/knip-baseline.json');

function run(val) {
  let baseline = {
    maxUnusedExports: 262,
    maxUnusedTypes: 100,
    maxDuplicateExports: 41,
    maxUnusedFiles: 0,
  };

  if (fs.existsSync(BASELINE_PATH)) {
    try {
      baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
    } catch {
      /* fallback to defaults */
    }
  }

  let data = null;
  try {
    const raw = execSync('npx knip --reporter json', {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, CI: 'true' }
    });
    data = JSON.parse(raw);
  } catch (err) {
    try {
      data = JSON.parse(err.stdout || '{}');
    } catch {
      val.error(`Knip Execution Failure: ${err.message}`);
      return;
    }
  }

  if (!data) {
    val.error('Failed to parse Knip output');
    return;
  }

  const unusedFiles = (data.files || []).length;
  let unusedExports = 0;
  let unusedTypes = 0;
  let duplicateExports = 0;

  const issues = data.issues || [];
  for (const item of issues) {
    unusedExports += (item.exports || []).length;
    unusedTypes += (item.types || []).length;
    duplicateExports += (item.duplicates || []).length;
  }

  let hasError = false;

  if (unusedFiles > baseline.maxUnusedFiles) {
    val.error(`Knip Violation: Detected ${unusedFiles} completely unused files (max allowed: ${baseline.maxUnusedFiles}). Files: ${(data.files || []).join(', ')}`);
    hasError = true;
  }

  if (unusedExports > baseline.maxUnusedExports) {
    val.error(`Knip Regression: Unused exports (${unusedExports}) exceeds baseline limit (${baseline.maxUnusedExports}). Remove dead exports before proceeding.`);
    hasError = true;
  }

  if (unusedTypes > baseline.maxUnusedTypes) {
    val.error(`Knip Regression: Unused types (${unusedTypes}) exceeds baseline limit (${baseline.maxUnusedTypes}). Remove dead exported types before proceeding.`);
    hasError = true;
  }

  if (duplicateExports > baseline.maxDuplicateExports) {
    val.error(`Knip Regression: Duplicate exports (${duplicateExports}) exceeds baseline limit (${baseline.maxDuplicateExports}). Unify duplicate exports before proceeding.`);
    hasError = true;
  }

  // Auto-ratchet down if improved
  let ratcheted = false;
  if (!hasError) {
    if (unusedExports < baseline.maxUnusedExports) {
      baseline.maxUnusedExports = unusedExports;
      ratcheted = true;
    }
    if (unusedTypes < baseline.maxUnusedTypes) {
      baseline.maxUnusedTypes = unusedTypes;
      ratcheted = true;
    }
    if (duplicateExports < baseline.maxDuplicateExports) {
      baseline.maxDuplicateExports = duplicateExports;
      ratcheted = true;
    }
    if (ratcheted) {
      baseline.updatedAt = new Date().toISOString();
      fs.writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + '\n');
      val.info(`Knip Ratchet Lowered: exports=${baseline.maxUnusedExports}, types=${baseline.maxUnusedTypes}, dups=${baseline.maxDuplicateExports}`);
    } else {
      val.info(`Knip Quality Gate Passed: exports=${unusedExports}/${baseline.maxUnusedExports}, types=${unusedTypes}/${baseline.maxUnusedTypes}, dups=${duplicateExports}/${baseline.maxDuplicateExports}, unusedFiles=${unusedFiles}`);
    }
  }
}

if (require.main === module) {
  runStandalone(META, run);
}
module.exports = { meta: META, run };
