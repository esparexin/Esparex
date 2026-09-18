#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { runStandalone, ROOT } = require('../shared');

const META = { id: 'AUDIT-001', name: 'Repository Auditor Baseline', version: '1.0.0', category: 'Governance' };

function run(val) {
  const AUDIT_REPORT = path.join(ROOT, 'audit-reports/repository-audit.json');

  // Verify against current working tree: re-run auditor if report is missing, stale (>5 mins), or previous FAIL
  let data = null;
  const isStale = (() => {
    if (!fs.existsSync(AUDIT_REPORT)) return true;
    try {
      const stat = fs.statSync(AUDIT_REPORT);
      return Date.now() - stat.mtimeMs > 300000; // Stale if older than 5 minutes
    } catch {
      return true;
    }
  })();

  if (isStale) {
    try {
      execSync('node scripts/repository-auditor.js', { cwd: ROOT, stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, CI: 'true' } });
    } catch (e) {
      val.error(`Repository Auditor Execution Failure: ${e.message}`);
      return;
    }
  }

  try {
    data = JSON.parse(fs.readFileSync(AUDIT_REPORT, 'utf-8'));
  } catch {
    val.error('Repository Auditor Report missing or corrupted: audit-reports/repository-audit.json');
    return;
  }

  if (data && data.summary) {
    if (data.summary.status === 'FAIL' || (data.summary.blockingViolations && data.summary.blockingViolations > 0)) {
      val.error('Repository Auditor Report Status: FAIL. Resolve blocking violations in audit-reports/repository-audit.json.');
    } else {
      val.info(`Repository Auditor Verified: ${data.summary.transitionalModules} transitional modules, ${data.summary.blockingViolations || 0} blocking boundary errors [Health: ${data.summary.policyHealth || 'PASS'}].`);
    }
  } else {
    val.error('Repository Auditor Report missing: audit-reports/repository-audit.json');
  }
}

if (require.main === module) {
  runStandalone(META, run);
}
module.exports = { meta: META, run };
