#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { runStandalone, ROOT } = require('../shared');

const META = { id: 'ARCH-PLATFORM-001', name: 'Architecture Platform Verification', version: '2.0.0', category: 'Architecture' };

const BASELINE_PATH = path.join(ROOT, 'scripts/policy/governance-debt-baseline.json');
const SUMMARY_PATH = path.join(ROOT, '.tooling/check-summary.json');

let baseline = { baselines: {} };
if (fs.existsSync(BASELINE_PATH)) {
  try {
    baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf-8'));
  } catch {
    // ignore corrupted or missing baseline
  }
}

const ESC = String.fromCharCode(27);
const ANSI_PATTERN = new RegExp(ESC + '\\[[0-9;]*[a-zA-Z]', 'g');
const stripAnsi = (str) => str.replace(ANSI_PATTERN, '');

function readCheckSummary() {
  if (!fs.existsSync(SUMMARY_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(SUMMARY_PATH, 'utf-8'));
  } catch {
    return null;
  }
}

function run(val) {
  let rawOut = '';
  let exitFailed = false;

  try {
    rawOut = execSync('npx tsx tooling/architecture/verify-architecture.ts', {
      cwd: ROOT,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (e) {
    exitFailed = true;
    rawOut = (e.stdout || '') + (e.stderr || '');
  }

  const cleanOut = stripAnsi(rawOut);
  const summary = readCheckSummary();

  const lines = cleanOut
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('→') || l.startsWith('->'));

  if (!exitFailed && summary && summary.passed && summary.score === 100 && lines.length === 0) {
    val.info(`Architecture platform verification passed (Score 100/100)`);
    return;
  }

  checkViolations(val, lines, summary, exitFailed);
}

function checkViolations(val, lines, summary, exitFailed) {
  const missingBarrels = baseline.baselines.missingPublicBarrels || [];
  const missingManifests = baseline.baselines.missingDomainManifests || [];

  let newViolations = [];

  for (const line of lines) {
    const isBarrelGrandfathered = missingBarrels.some((b) => line.includes(`Domain "${b}"`) || line.includes(`"${b}"`));
    const isManifestGrandfathered = missingManifests.some((m) => line.includes(`/domains/${m}/manifest.yaml`));

    if (isBarrelGrandfathered || isManifestGrandfathered) {
      val.warning(`Grandfathered Architectural Debt: ${line.trim()}`);
    } else {
      newViolations.push(line.trim());
    }
  }

  if (newViolations.length > 0) {
    for (const v of newViolations) {
      val.error(`NEW Architectural Violation: ${v}`);
    }
    val.error(`Architecture Platform Verification failed ratchet check (${newViolations.length} new violations detected)`);
  } else if (exitFailed || (summary && !summary.passed)) {
    val.error(
      `Architecture Platform Verification failed: score ${summary ? summary.score : 'unknown'}/100 is below the threshold of 90`
    );
  } else {
    const scoreText = summary ? `${summary.score}/100` : 'passed';
    val.info(`Architecture Platform Verification passed ratchet check (Score: ${scoreText})`);
  }
}

if (require.main === module) {
  runStandalone(META, run);
}
module.exports = { meta: META, run };
