#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Validation, runStandalone, ROOT } = require('../shared');

const META = { id: 'GOV-GUARDS-001', name: 'Platform Governance Guards Suite', version: '1.0.0', category: 'Governance' };

const BASELINE_PATH = path.join(ROOT, 'scripts/policy/governance-debt-baseline.json');
let baseline = { baselines: {} };
if (fs.existsSync(BASELINE_PATH)) {
  try {
    baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf-8'));
  } catch {}
}

const GUARDS = [
  { name: 'Naming Conventions', cmd: 'node scripts/enforce-file-naming-conventions.js', baselineKey: 'namingViolations' },
  { name: 'Platform Governance', cmd: 'node scripts/guard-platform-governance.js', baselineKey: 'platformGovernanceViolations' },
  { name: 'Admin Status Literals', cmd: 'node scripts/enforce-admin-status-literals.js', baselineKey: 'adminStatusLiteralViolations' },
  { name: 'ObjectId Validation', cmd: 'node scripts/enforce-objectid-validation.js', baselineKey: 'objectIdViolations' },
  { name: 'Notification Governance', cmd: 'node scripts/enforce-notification-governance.js', baselineKey: 'notificationViolations' },
  { name: 'API Surface Guard', cmd: 'node scripts/enforce-api-surface-guard.js', baselineKey: 'apiSurfaceViolations' },
  { name: 'Component API Boundary', cmd: 'node scripts/enforce-component-api-boundary.js', baselineKey: 'componentBoundaryViolations' },
  { name: 'Compatibility Markers Baseline', cmd: 'node scripts/enforce-compatibility-markers-baseline.js', baselineKey: 'compatibilityViolations' },
  { name: 'Generated Artifacts', cmd: 'node scripts/guard-generated-artifacts.js', baselineKey: 'artifactViolations' },
  { name: 'API Contract Parity', cmd: 'node scripts/verify-api-contract.js --scope=all', baselineKey: 'apiContractViolations' },
];

function run(val) {
  let passedCount = 0;
  let newErrorsCount = 0;

  for (const g of GUARDS) {
    try {
      execSync(g.cmd, { cwd: ROOT, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
      passedCount++;
    } catch (e) {
      const output = (e.stdout || '') + (e.stderr || '');
      const itemLines = output.trim().split('\n').filter(l => {
        const trimmed = l.trim();
        return (trimmed.startsWith('-') || trimmed.startsWith('apps/') || trimmed.startsWith('packages/') || trimmed.includes('literal=')) && !trimmed.startsWith('❌') && !trimmed.startsWith('[HINT]') && !trimmed.startsWith('FAIL:');
      });

      const grandfatheredList = baseline.baselines[g.baselineKey] || [];
      let newViolationsForGuard = [];

      for (const line of itemLines) {
        const isGrandfathered = grandfatheredList.some(item => line.includes(item));
        if (isGrandfathered) {
          val.warning(`Grandfathered Debt [${g.name}]: ${line.trim()}`);
        } else {
          newViolationsForGuard.push(line.trim());
        }
      }

      if (newViolationsForGuard.length > 0) {
        newErrorsCount++;
        for (const unbaselined of newViolationsForGuard) {
          val.error(`NEW Governance Violation [${g.name}]: ${unbaselined}`);
        }
      } else if (itemLines.length > 0) {
        passedCount++;
      } else {
        newErrorsCount++;
        val.error(`NEW Governance Violation [${g.name}]: Check failed with unparseable output`);
      }
    }
  }

  if (newErrorsCount === 0) {
    val.info(`Platform Governance Guards Suite passed ratchet check (${passedCount}/${GUARDS.length} clean, baseline debt tracked)`);
  } else {
    val.error(`Platform Governance Guards Suite failed ratchet check (${newErrorsCount} new violation categories detected)`);
  }
}

if (require.main === module) {
  runStandalone(META, run);
}
module.exports = { meta: META, run };
