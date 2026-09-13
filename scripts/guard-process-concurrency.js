#!/usr/bin/env node

/**
 * guard-process-concurrency.js
 *
 * Process Concurrency & System Resource Safety Guard.
 * Enforces:
 * 1. Test runner single-worker isolation:
 *    - All Jest test scripts must specify `--runInBand` or `maxWorkers=1`.
 *    - All Vitest test scripts must specify `--fileParallelism=false` or `--maxWorkers=1`.
 * 2. Type-check isolation:
 *    - Workspace `type-check` scripts must not run recursive `npm run build` chains.
 * 3. Validation workflow safety:
 *    - No gate or validation script may spawn unconstrained concurrent processes.
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const violations = [];

console.log('🛡️  Running Process Concurrency & System Resource Safety Guard...\n');

const WORKSPACE_DIRS = [
  ROOT,
  path.join(ROOT, 'backend/api'),
  path.join(ROOT, 'core'),
  path.join(ROOT, 'shared'),
];

// Discover packages/* and apps/*
['packages', 'apps'].forEach((sub) => {
  const dir = path.join(ROOT, sub);
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach((pkg) => {
      const pkgDir = path.join(dir, pkg);
      if (fs.existsSync(path.join(pkgDir, 'package.json'))) {
        WORKSPACE_DIRS.push(pkgDir);
      }
    });
  }
});

for (const pkgDir of WORKSPACE_DIRS) {
  const pkgJsonPath = path.join(pkgDir, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) continue;

  const relPkg = path.relative(ROOT, pkgJsonPath) || 'package.json';
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  } catch (e) {
    violations.push(`Invalid JSON in ${relPkg}: ${e.message}`);
    continue;
  }

  const scripts = pkg.scripts || {};

  // Check 1: Test scripts must enforce single-worker execution
  for (const [name, cmd] of Object.entries(scripts)) {
    if (typeof cmd !== 'string') continue;

    // Check Jest usage
    if (cmd.includes('jest') && !cmd.includes('--runInBand') && !cmd.includes('--maxWorkers=1')) {
      // Check if jest.config.js enforces maxWorkers: 1
      const jestConfigJs = path.join(pkgDir, 'jest.config.js');
      const jestConfigTs = path.join(pkgDir, 'jest.config.ts');
      let configEnforced = false;
      if (fs.existsSync(jestConfigJs)) {
        const content = fs.readFileSync(jestConfigJs, 'utf8');
        if (content.includes('maxWorkers: 1') || content.includes('maxWorkers:1')) configEnforced = true;
      } else if (fs.existsSync(jestConfigTs)) {
        const content = fs.readFileSync(jestConfigTs, 'utf8');
        if (content.includes('maxWorkers: 1') || content.includes('maxWorkers:1')) configEnforced = true;
      }

      // Ignore forwarder scripts in root package.json that delegate to workspaces
      if (relPkg !== 'package.json' && !configEnforced) {
        violations.push(
          `${relPkg} script "${name}" invokes jest without --runInBand or maxWorkers=1. ` +
          `Unconstrained worker pools exhaust CPU/memory and freeze developer machines.`
        );
      }
    }

    // Check Vitest usage
    if (cmd.includes('vitest') && !cmd.includes('--fileParallelism=false') && !cmd.includes('--maxWorkers=1')) {
      if (relPkg !== 'package.json') {
        violations.push(
          `${relPkg} script "${name}" invokes vitest without --fileParallelism=false or --maxWorkers=1. ` +
          `Controlled concurrency is mandatory.`
        );
      }
    }

    // Check 2: Workspace type-check scripts must not trigger cascading builds
    if (name === 'type-check' && relPkg !== 'package.json') {
      if (cmd.includes('npm run build') || cmd.includes('npm build')) {
        violations.push(
          `${relPkg} script "${name}" contains nested "npm run build". ` +
          `Upstream libraries must be built once in root build:libs to prevent cascading build storms and IDE tsserver thrashing.`
        );
      }
    }

    // Check 3: Disallow unconstrained concurrency in gate or validation scripts
    if ((name.startsWith('guard:') || name.startsWith('repo:') || name.startsWith('lint:') || name === 'pr:gate') && cmd.includes('concurrently')) {
      violations.push(
        `${relPkg} script "${name}" uses "concurrently" in validation workflow. ` +
        `Validation scripts must execute sequentially with controlled resource usage.`
      );
    }
  }
}

if (violations.length > 0) {
  console.error('❌ Process Concurrency & Resource Safety Violations Detected:\n');
  violations.forEach((v) => console.error(`  - ${v}`));
  console.error('\nFix: Enforce single-worker mode (--runInBand / --fileParallelism=false) and remove nested build chains.\n');
  process.exit(1);
}

console.log('✅ Process Concurrency & System Resource Safety Guard: All workspaces conform to sequential single-worker execution standards.\n');
process.exit(0);
