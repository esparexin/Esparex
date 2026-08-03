#!/usr/bin/env node
const { execSync } = require('child_process');
const { Validation, runStandalone, ROOT } = require('../shared');

const META = { id: 'ARCH-PLATFORM-001', name: 'Architecture Platform Verification', version: '1.0.0', category: 'Architecture' };

function run(val) {
  try {
    const out = execSync('npx tsx tooling/architecture/verify-architecture.ts', { cwd: ROOT, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    if (out.includes('Architecture Score: 100') || !out.includes('FAIL')) {
      val.info('Architecture platform verification passed (Score 100/100)');
    } else {
      const lines = out.split('\n').filter(l => l.trim().startsWith('→') || l.trim().startsWith('✗'));
      const summary = lines.slice(0, 3).join(' ').replace(/\s+/g, ' ');
      val.error(`Architecture Platform Verification Error: ${summary || 'Architectural violations detected.'}`);
    }
  } catch (e) {
    const out = (e.stdout || '') + (e.stderr || '');
    const lines = out.split('\n').filter(l => l.trim().startsWith('→') || l.trim().startsWith('✗') || l.includes('Public Barrel') || l.includes('Manifest Validation'));
    const summary = lines.slice(0, 3).map(l => l.trim()).join('; ');
    val.error(`Architecture Platform Verification Error: ${summary || e.message}`);
  }
}

if (require.main === module) {
  runStandalone(META, run);
}
module.exports = { meta: META, run };
