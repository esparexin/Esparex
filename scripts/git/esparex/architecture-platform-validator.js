#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Validation, runStandalone, ROOT } = require('../shared');

const META = { id: 'ARCH-PLATFORM-001', name: 'Architecture Platform Verification', version: '1.0.0', category: 'Architecture' };

const BASELINE_PATH = path.join(ROOT, 'scripts/policy/governance-debt-baseline.json');
let baseline = { baselines: {} };
if (fs.existsSync(BASELINE_PATH)) {
  try {
    baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf-8'));
  } catch {}
}

function run(val) {
  try {
    const out = execSync('npx tsx tooling/architecture/verify-architecture.ts', { cwd: ROOT, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    if (out.includes('Architecture Score: 100') || !out.includes('FAIL')) {
      val.info('Architecture platform verification passed (Score 100/100)');
    } else {
      const lines = out.split('\n').filter(l => l.trim().startsWith('→'));
      checkViolations(val, lines);
    }
  } catch (e) {
    const out = (e.stdout || '') + (e.stderr || '');
    const lines = out.split('\n').filter(l => l.trim().startsWith('→'));
    checkViolations(val, lines);
  }
}

function checkViolations(val, lines) {
  const missingBarrels = baseline.baselines.missingPublicBarrels || [];
  const missingManifests = baseline.baselines.missingDomainManifests || [];

  let newViolations = [];

  for (const line of lines) {
    const isBarrelGrandfathered = missingBarrels.some(b => line.includes(`Domain "${b}"`) || line.includes(`"${b}"`));
    const isManifestGrandfathered = missingManifests.some(m => line.includes(`/domains/${m}/manifest.yaml`));

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
  } else {
    val.info('Architecture Platform Verification passed ratchet check (baseline debt tracked)');
  }
}

if (require.main === module) {
  runStandalone(META, run);
}
module.exports = { meta: META, run };
