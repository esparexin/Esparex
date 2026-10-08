#!/usr/bin/env node
/**
 * No-legacy-lifecycle guard (DECISION-GATE C-10).
 *
 * The legacy cluster core/src/services/lifecycle/ was deleted in Phase 7 after
 * full consumer migration (all importers now target the listings domain).
 * Both burn-down lists below are intentionally empty: any reappearance of the
 * directory, its files, or an importer fails the gate. The guard is retained
 * (rather than deleted) to prevent resurrection.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const LIFECYCLE_DIR = path.join(ROOT, 'core', 'src', 'services', 'lifecycle');

// Burn-down complete (Phase 7): shims deleted. Empty set — any file
// reappearing under the legacy dir fails the gate.
const KNOWN_FILES = new Set([]);

// Burn-down complete (Phase 7): all importers migrated to the listings
// domain. Empty set — any new importer fails the gate.
const KNOWN_IMPORTERS = new Set([]);

const IMPORT_PATTERN = /(?:import|export)[^'"]*['"][^'"]*services\/lifecycle[^'"]*['"]|require\(\s*['"][^'"]*services\/lifecycle[^'"]*['"]\s*\)/;

function main() {
  const failures = [];

  // 1. No new files under the legacy dir.
  if (fs.existsSync(LIFECYCLE_DIR)) {
    for (const entry of fs.readdirSync(LIFECYCLE_DIR)) {
      const rel = `core/src/services/lifecycle/${entry}`;
      if (!KNOWN_FILES.has(rel)) {
        failures.push(`new file under legacy dir: ${rel}`);
      }
    }
    for (const known of KNOWN_FILES) {
      if (!fs.existsSync(path.join(ROOT, known))) {
        failures.push(`burn-down list stale — already deleted: ${known} (remove it from scripts/enforce-no-legacy-lifecycle.js)`);
      }
    }
  }

  // 2. No new importers (tracked non-test TS files, whole tree).
  let tracked = '';
  try {
    tracked = execSync('git ls-files', { cwd: ROOT, encoding: 'utf-8' });
  } catch {
    console.error('❌ C-10: cannot list tracked files (git ls-files failed).');
    process.exit(1);
  }
  for (const rel of tracked.split('\n').filter(Boolean)) {
    if (!/\.(ts|tsx|js|jsx)$/.test(rel)) continue;
    if (rel.includes('__tests__') || /\.spec\.[tj]sx?$/.test(rel) || /\.test\.[tj]sx?$/.test(rel)) continue;
    if (rel.startsWith('core/src/services/lifecycle/')) continue;
    let content;
    try {
      content = fs.readFileSync(path.join(ROOT, rel), 'utf-8');
    } catch {
      continue;
    }
    if (IMPORT_PATTERN.test(content) && !KNOWN_IMPORTERS.has(rel)) {
      failures.push(`new importer of services/lifecycle: ${rel}`);
    }
  }

  if (failures.length > 0) {
    console.error('❌ C-10 no-legacy-lifecycle: legacy cluster grew:');
    for (const f of failures) console.error(`   - ${f}`);
    console.error('   Migrate consumers to the listings domain instead of extending core/src/services/lifecycle/.');
    process.exit(1);
  }

  console.log('✅ C-10 no-legacy-lifecycle: no new files or importers under core/src/services/lifecycle/.');
  process.exit(0);
}

if (require.main === module) main();

module.exports = { KNOWN_FILES, KNOWN_IMPORTERS };
