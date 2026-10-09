#!/usr/bin/env node
/**
 * Model registry parity (DECISION-GATE C-13).
 *
 * Set-equality check: core/src/models/registry.ts must import exactly the set
 * of model files in core/src/models/*.ts (excluding registry.ts itself).
 * Every model file must be registered (side-effect import) so the model is
 * bound on boot; no stale imports may linger.
 *
 * Usage:
 *   node scripts/enforce-model-registry-parity.js          # check only (CI)
 *   node scripts/enforce-model-registry-parity.js --write  # auto-fix drift
 *
 * Exit 0 = parity. Exit 1 = drift (lists missing/extra).
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MODELS_DIR = path.join(ROOT, 'core', 'src', 'models');
const REGISTRY = path.join(MODELS_DIR, 'registry.ts');
const WRITE = process.argv.includes('--write');

function registryImports() {
  const content = fs.readFileSync(REGISTRY, 'utf-8');
  return [...content.matchAll(/^import\s+['"]\.\/([^'"]+)['"]/gm)].map((m) => m[1]);
}

function modelFiles() {
  return fs.readdirSync(MODELS_DIR)
    .filter((f) => f.endsWith('.ts') && f !== 'registry.ts')
    .map((f) => f.replace(/\.ts$/, ''))
    .sort();
}

function main() {
  const imported = registryImports();
  const files = modelFiles();
  const importedSet = new Set(imported);
  const fileSet = new Set(files);
  const missing = files.filter((f) => !importedSet.has(f));
  const extra = imported.filter((i) => !fileSet.has(i));

  if (WRITE) {
    if (missing.length === 0 && extra.length === 0) {
      console.log('✅ C-13 registry parity: already in sync (--write: no changes).');
      process.exit(0);
    }
    let content = fs.readFileSync(REGISTRY, 'utf-8');
    for (const m of extra) {
      content = content.replace(new RegExp(`^import\\s+['"]\\.\\/${m}['"];?\\n?`, 'm'), '');
    }
    // Append missing imports in sorted order, grouped after the last import.
    const additions = missing.map((m) => `import './${m}';`).join('\n');
    const lines = content.split('\n');
    let lastImport = -1;
    lines.forEach((l, i) => { if (/^import\s+['"]/.test(l)) lastImport = i; });
    lines.splice(lastImport + 1, 0, additions);
    fs.writeFileSync(REGISTRY, lines.join('\n').replace(/\n{3,}/g, '\n\n'));
    console.log(`✅ C-13 registry parity (--write): added ${missing.length}, removed ${extra.length}.`);
    process.exit(0);
  }

  if (missing.length === 0 && extra.length === 0) {
    console.log(`✅ C-13 registry parity: registry.ts imports == ${files.length} model files.`);
    process.exit(0);
  }

  console.error('❌ C-13 registry parity drift:');
  for (const m of missing) console.error(`   - model file not registered: ${m}`);
  for (const e of extra) console.error(`   - stale registry import (no such model file): ${e}`);
  console.error('   Run: node scripts/enforce-model-registry-parity.js --write');
  process.exit(1);
}

if (require.main === module) main();

module.exports = { registryImports, modelFiles };
