#!/usr/bin/env node
const { execSync } = require('child_process');
const { Validation, runStandalone, ROOT } = require('../shared');

const META = { id: 'DEP-001', name: 'Dependency Boundary Validation', version: '1.0.0', category: 'Architecture' };

function run(val) {
  try {
    const out = execSync('npx depcruise --config .dependency-cruiser.js core backend/api apps/web/src apps/admin/src', {
      cwd: ROOT,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    if (out.includes('error ')) {
      val.error(`Dependency boundary violations detected:\n${out.trim()}`);
    } else {
      val.info('Dependency boundary checks passed with 0 errors');
    }
  } catch (e) {
    const output = (e.stdout || '') + (e.stderr || '');
    if (output.includes('error ')) {
      val.error(`Dependency boundary violations detected:\n${output.trim()}`);
    } else {
      val.error(`Dependency cruiser check failed: ${e.message}`);
    }
  }
}

if (require.main === module) {
  runStandalone(META, run);
}
module.exports = { meta: META, run };
