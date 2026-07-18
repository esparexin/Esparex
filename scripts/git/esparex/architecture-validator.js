#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Validation, runStandalone, ROOT } = require('../shared');

const META = { id: 'ARCH-001', name: 'Architecture Validation', version: '1.0.0', category: 'Architecture' };

function run(val) {
  const changedFiles = (() => {
    try {
      const out = execSync('git diff --cached --name-only --diff-filter=ACMR', { cwd: ROOT, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
      return out.split('\n').filter(Boolean);
    } catch { return []; }
  })();

  const srcFiles = changedFiles.filter(f => /\.(ts|tsx|js|jsx)$/.test(f) && !f.includes('node_modules'));
  if (srcFiles.length === 0) return;

  for (const file of srcFiles) {
    const fullPath = path.join(ROOT, file);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, 'utf-8');

    const importRe = /(?:from|require)\s*\(?\s*['"]([^'"]+)['"]\s*\)?/g;
    const matches = content.matchAll(importRe);

    for (const match of matches) {
      const importPath = match[1];
      if (!importPath.startsWith('@esparex/')) continue;

      const isInApps = file.startsWith('apps/');

      if (isInApps && importPath.replace('@esparex/', '').startsWith('backend')) {
        val.warning(`Architecture: ${file} imports backend "${importPath}". Apps should not import backend.`);
      }

      if (importPath.includes('/dist/')) {
        val.warning(`Deep import from dist in ${file}: ${importPath}. Import from package root instead.`);
      }
    }
  }
}

if (require.main === module) {
  runStandalone(META, run);
}
module.exports = { meta: META, run };
