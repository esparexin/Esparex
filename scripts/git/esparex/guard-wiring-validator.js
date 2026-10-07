#!/usr/bin/env node
const { execSync } = require('child_process');
const { runStandalone, ROOT } = require('../shared');

const META = { id: 'GUARD-WIRING-001', name: 'Guard Wiring Meta-Guard (C-1)', version: '1.0.0', category: 'Governance' };

function run(val) {
  try {
    const out = execSync('node scripts/enforce-guard-wiring.js', {
      cwd: ROOT, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'],
    });
    const summary = out.split('\n').filter((l) => l.includes('/')).slice(0, 3);
    val.info(`C-1 guard wiring intact — ${summary.join('; ').replace(/[🔌✅]/g, '').trim()}`);
  } catch (e) {
    const output = ((e.stdout || '') + (e.stderr || '')).trim();
    const violations = output.split('\n').filter((l) => l.trim().startsWith('- '));
    if (violations.length > 0) {
      for (const v of violations) val.error(`C-1 guard wiring gap: ${v.trim().replace(/^- /, '')}`);
    } else {
      val.error(`C-1 meta-guard execution failed: ${e.message}`);
    }
  }
}

if (require.main === module) {
  runStandalone(META, run);
}
module.exports = { meta: META, run };
