#!/usr/bin/env node
/**
 * Exports surface parity (DECISION-GATE C-8 / P1-10).
 *
 * Set-equality check: core/package.json `exports` must equal the documented
 * surface — "." + "./domains/<name>" for every domain barrel in
 * core/src/domains, plus the documented exceptions in
 * scripts/policy/core-exports-exceptions.json.
 *
 * Any drift (a new deep subpath like ./models/*, or a missing domain barrel)
 * fails the gate. This keeps the package config from re-legalizing what the
 * boundary rules forbid (audit 02/V2-V3).
 *
 * Exit 0 = parity. Exit 1 = drift (lists missing/extra entries).
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function documentedSurface() {
  const domainsDir = path.join(ROOT, 'core', 'src', 'domains');
  const domains = fs.readdirSync(domainsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => fs.existsSync(path.join(domainsDir, name, 'index.ts')));
  const expected = new Set(['.', ...domains.map((d) => `./domains/${d}`)]);
  const exceptionsPath = path.join(ROOT, 'scripts', 'policy', 'core-exports-exceptions.json');
  try {
    const exceptions = JSON.parse(fs.readFileSync(exceptionsPath, 'utf-8')).exceptions || {};
    for (const key of Object.keys(exceptions)) expected.add(key);
  } catch {
    // no exceptions file — surface is exactly root + domain barrels
  }
  return expected;
}

function actualExports() {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'core', 'package.json'), 'utf-8'));
  return new Set(Object.keys(pkg.exports || {}));
}

function main() {
  const expected = documentedSurface();
  const actual = actualExports();
  const missing = [...expected].filter((k) => !actual.has(k));
  const extra = [...actual].filter((k) => !expected.has(k));

  if (missing.length === 0 && extra.length === 0) {
    console.log(`✅ C-8 exports surface parity: ${actual.size} exports == documented surface (. + domain barrels + documented exceptions).`);
    process.exit(0);
  }

  console.error('❌ C-8 exports surface drift: package.json exports != documented surface.');
  for (const k of missing) console.error(`   - missing from exports map: ${k}`);
  for (const k of extra) console.error(`   - extra in exports map (not in documented surface): ${k}`);
  console.error('   Documented surface: "." + "./domains/<name>" per domain barrel + scripts/policy/core-exports-exceptions.json.');
  process.exit(1);
}

if (require.main === module) main();

module.exports = { documentedSurface, actualExports };
