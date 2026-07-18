#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Validation, runStandalone, ROOT } = require('../shared');

const META = { id: 'SSOT-001', name: 'SSOT Validation', version: '1.0.0', category: 'Architecture' };

function run(val) {
  const changedFiles = (() => {
    try {
      const out = execSync('git diff --cached --name-only --diff-filter=ACMR', { cwd: ROOT, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
      return out.split('\n').filter(Boolean);
    } catch { return []; }
  })();

  const srcFiles = changedFiles.filter(f => /\.(ts|tsx|js|jsx)$/.test(f) && !f.includes('node_modules'));
  if (srcFiles.length === 0) return;

  const exportMap = new Map();

  for (const file of srcFiles) {
    const fullPath = path.join(ROOT, file);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, 'utf-8');

    const exportMatches = content.matchAll(/^export\s+(?:const|function|class|interface|type|enum|default\s+(?:const|function|class))\s+(\w+)/gm);
    for (const match of exportMatches) {
      const symbol = match[1];
      if (exportMap.has(symbol) && exportMap.get(symbol) !== file) {
        val.warning(`Symbol "${symbol}" exported from both ${file} and ${exportMap.get(symbol)}. Possible SSOT violation.`);
      } else {
        exportMap.set(symbol, file);
      }
    }

    const importMatches = content.matchAll(/from\s+['"](@esparex\/[^'"]+)['"]/g);
    for (const match of importMatches) {
      if (match[1].includes('/dist/')) {
        val.warning(`Deep import from dist in ${file}: ${match[1]}. Import from package root instead.`);
      }
    }
  }
}

if (require.main === module) {
  runStandalone(META, run);
}
module.exports = { meta: META, run };
