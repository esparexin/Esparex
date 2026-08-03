#!/usr/bin/env node
const { execSync } = require('child_process');
const { Validation, runStandalone, ROOT } = require('../shared');

const META = { id: 'GOV-GUARDS-001', name: 'Platform Governance Guards Suite', version: '1.0.0', category: 'Governance' };

const GUARDS = [
  { name: 'Naming Conventions', cmd: 'node scripts/enforce-file-naming-conventions.js' },
  { name: 'Platform Governance', cmd: 'node scripts/guard-platform-governance.js' },
  { name: 'Admin Status Literals', cmd: 'node scripts/enforce-admin-status-literals.js' },
  { name: 'ObjectId Validation', cmd: 'node scripts/enforce-objectid-validation.js' },
  { name: 'Notification Governance', cmd: 'node scripts/enforce-notification-governance.js' },
  { name: 'API Surface Guard', cmd: 'node scripts/enforce-api-surface-guard.js' },
  { name: 'Component API Boundary', cmd: 'node scripts/enforce-component-api-boundary.js' },
  { name: 'Compatibility Markers Baseline', cmd: 'node scripts/enforce-compatibility-markers-baseline.js' },
  { name: 'Generated Artifacts', cmd: 'node scripts/guard-generated-artifacts.js' },
];

function run(val) {
  let passedCount = 0;
  for (const g of GUARDS) {
    try {
      execSync(g.cmd, { cwd: ROOT, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
      passedCount++;
    } catch (e) {
      const output = (e.stdout || '') + (e.stderr || '');
      const firstLine = output.trim().split('\n').find(l => l.includes('❌') || l.includes('FAIL') || l.includes('Check Failed')) || `${g.name} check failed`;
      val.error(`Governance Guard Error [${g.name}]: ${firstLine.trim()}`);
    }
  }
  if (passedCount === GUARDS.length) {
    val.info(`Platform Governance Guards Suite executed (${passedCount}/${GUARDS.length} passed)`);
  } else {
    val.error(`Platform Governance Guards Suite failed (${passedCount}/${GUARDS.length} passed)`);
  }
}

if (require.main === module) {
  runStandalone(META, run);
}
module.exports = { meta: META, run };
