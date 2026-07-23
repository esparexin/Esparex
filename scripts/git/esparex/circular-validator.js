#!/usr/bin/env node
const { execSync } = require('child_process');
const { Validation, runStandalone, ROOT } = require('../shared');

const META = { id: 'CIRC-001', name: 'Circular Dependency Validation', version: '1.0.0', category: 'Architecture' };

function run(val) {
  try {
    const out = execSync('npx madge --circular --extensions ts,tsx core/src backend/api/src apps/web/src apps/admin/src', {
      cwd: ROOT,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    if (out.includes('Found') && out.includes('circular dependencies')) {
      val.error(`Circular dependencies detected:\n${out.trim()}`);
    } else {
      val.info('Zero circular dependencies detected across core, backend, and apps');
    }
  } catch (e) {
    const output = (e.stdout || '') + (e.stderr || '');
    if (output.includes('Found') && output.includes('circular dependencies')) {
      val.error(`Circular dependencies detected:\n${output.trim()}`);
    } else {
      val.error(`Madge check failed: ${e.message}`);
    }
  }
}

if (require.main === module) {
  runStandalone(META, run);
}
module.exports = { meta: META, run };
