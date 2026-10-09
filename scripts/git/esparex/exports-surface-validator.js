#!/usr/bin/env node
const { execSync } = require('child_process');
const { runStandalone, ROOT } = require('../shared');

const META = { id: 'EXPORTS-001', name: 'Exports Surface Parity (C-8)', version: '1.0.0', category: 'Architecture' };

function run(val) {
  try {
    const out = execSync('node scripts/enforce-exports-surface-parity.js', {
      cwd: ROOT, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'],
    });
    val.info(out.trim().split('\n').pop() || 'C-8 exports surface parity passed');
  } catch (e) {
    const output = ((e.stdout || '') + (e.stderr || '')).trim();
    for (const line of output.split('\n').filter((l) => l.trim().startsWith('- '))) {
      val.error(`C-8 exports surface drift: ${line.trim().replace(/^- /, '')}`);
    }
    if (!output.includes('- ')) val.error(`C-8 exports surface check failed: ${e.message}`);
  }
}

if (require.main === module) {
  runStandalone(META, run);
}
module.exports = { meta: META, run };
