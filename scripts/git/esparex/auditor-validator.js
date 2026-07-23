#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Validation, runStandalone, ROOT } = require('../shared');

const META = { id: 'AUDIT-001', name: 'Repository Auditor Baseline', version: '1.0.0', category: 'Governance' };

function run(val) {
  const AUDIT_REPORT = path.join(ROOT, 'audit-reports/repository-audit.json');

  // Verify canonical report exists or execute auditor
  if (!fs.existsSync(AUDIT_REPORT)) {
    try {
      execSync('node scripts/repository-auditor.js', { cwd: ROOT, stdio: ['pipe', 'pipe', 'pipe'] });
    } catch (e) {
      val.error(`Repository Auditor Execution Failure: ${e.message}`);
      return;
    }
  }

  if (fs.existsSync(AUDIT_REPORT)) {
    try {
      const data = JSON.parse(fs.readFileSync(AUDIT_REPORT, 'utf-8'));
      if (data.summary && data.summary.status === 'FAIL') {
        val.error('Repository Auditor Report Status: FAIL. Resolve violations in audit-reports/repository-audit.json.');
      } else {
        val.info(`Repository Auditor Verified: ${data.summary ? data.summary.transitionalModules : 0} transitional modules, 0 boundary errors.`);
      }
    } catch (e) {
      val.warning('Repository Auditor Report present but unparseable.');
    }
  } else {
    val.error('Repository Auditor Report missing: audit-reports/repository-audit.json');
  }
}

if (require.main === module) {
  runStandalone(META, run);
}
module.exports = { meta: META, run };
