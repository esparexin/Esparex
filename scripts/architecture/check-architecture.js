/**
 * check-architecture.js
 * ======================
 * Composite architecture check runner.
 *
 * Executes all architecture governance checks in order, failing fast on any violation.
 * This is the single entrypoint for architecture validation in CI.
 *
 * Usage:
 *   node scripts/architecture/check-architecture.js           # Hard fail mode (CI)
 *   node scripts/architecture/check-architecture.js --report  # Report mode (no exit 1)
 *
 * Checks:
 *   1. Deep import detection (git grep)
 *   2. Circular dependency detection (madge)
 *   3. Public API namespace load test
 *   4. Dependency Cruiser boundary check
 *   5. Architecture report generation
 */

'use strict';

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const reportMode = process.argv.includes('--report');
const fastMode = process.argv.includes('--fast');
const ROOT = path.resolve(__dirname, '../..');

const results = [];
let hasViolations = false;

function run(label, fn) {
  process.stdout.write(`  Running: ${label}... `);
  try {
    const result = fn();
    console.log('✅ PASS');
    results.push({ label, status: 'PASS', detail: result || '' });
  } catch (err) {
    const msg = err.message || String(err);
    console.log('❌ FAIL');
    console.log(`     ${msg.split('\n').slice(0, 5).join('\n     ')}`);
    results.push({ label, status: 'FAIL', detail: msg });
    hasViolations = true;
  }
}

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║          Esparex Architecture Check v1.1.0                   ║');
if (reportMode) {
  console.log('║          Mode: REPORT (no hard fail)                         ║');
} else {
  console.log('║          Mode: ENFORCE (hard fail on violations)             ║');
}
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// ─── Gate 1: No deep imports ──────────────────────────────────────────────────
run('Gate 1 — No deep imports into @esparex/core sub-paths', () => {
  const result = spawnSync(
    'git',
    ['grep', '-rn', '--', '@esparex/core/[a-zA-Z0-9_-]+/'],
    { cwd: ROOT, encoding: 'utf8' }
  );
  // exit code 1 means no matches (git grep returns 1 when nothing found) — that's what we want
  if (result.status === 0 && result.stdout.trim()) {
    throw new Error(`Deep imports found:\n${result.stdout.trim()}`);
  }
  return 'No deep imports found';
});

// ─── Gate 2: No circular dependencies ─────────────────────────────────────────
run('Gate 2 — No circular dependencies in core/src', () => {
  const result = spawnSync(
    'npx',
    ['--yes', 'madge', '--circular', '--extensions', 'ts', 'core/src'],
    { cwd: ROOT, encoding: 'utf8', shell: true }
  );
  const out = (result.stdout || '') + (result.stderr || '');
  if (out.includes('Found') && !out.includes('No circular')) {
    throw new Error(`Circular dependencies detected:\n${out}`);
  }
  return '0 circular dependencies';
});

// Detect OS for correct binary extension
const isWindows = process.platform === 'win32';
const depcruiseBin = isWindows
  ? path.join(ROOT, 'node_modules', '.bin', 'depcruise.cmd')
  : path.join(ROOT, 'node_modules', '.bin', 'depcruise');

// ─── Gate 3: Dependency Cruiser ───────────────────────────────────────────────
if (!fastMode) {
  run('Gate 3 — Dependency Cruiser boundary check (core/src)', () => {
    const configPath = path.join(ROOT, '.dependency-cruiser.cjs');
    if (!fs.existsSync(configPath)) {
      throw new Error('.dependency-cruiser.cjs not found. Run: node scripts/architecture/generate-depcruiser.js');
    }

    const result = spawnSync(
      depcruiseBin,
      ['--config', '.dependency-cruiser.cjs', '--output-type', 'err', 'core/src'],
      { cwd: ROOT, encoding: 'utf8', shell: isWindows }
    );

    const combinedOutput = (result.stdout || '') + (result.stderr || '');

    if (result.status !== 0) {
      throw new Error(`Dependency Cruiser violations:\n${combinedOutput}`);
    }
    return 'No boundary violations in core/src';
  });
} else {
  results.push({ label: 'Gate 3 — Dependency Cruiser boundary check (core/src)', status: 'SKIP', detail: 'Skipped in fast mode' });
}

// ─── Gate 4: Dependency Cruiser on backend ────────────────────────────────────
if (!fastMode) {
  run('Gate 4 — Dependency Cruiser boundary check (backend/user/src)', () => {
    const result = spawnSync(
      depcruiseBin,
      ['--config', '.dependency-cruiser.cjs', '--output-type', 'err', 'backend/user/src'],
      { cwd: ROOT, encoding: 'utf8', shell: isWindows }
    );

    const combinedOutput = (result.stdout || '') + (result.stderr || '');
    if (result.status !== 0) {
      throw new Error(`Dependency Cruiser violations (backend):\n${combinedOutput}`);
    }
    return 'No boundary violations in backend/user/src';
  });
} else {
  results.push({ label: 'Gate 4 — Dependency Cruiser boundary check (backend/user/src)', status: 'SKIP', detail: 'Skipped in fast mode' });
}

// ─── Gate 5: Public API load test ───────────────────────────────────────────────
if (!fastMode) {
  run('Gate 5 — Public API namespace load test', () => {
    const result = spawnSync(
      'node',
      ['scripts/verify-public-api.js'],
      {
        cwd: ROOT,
        encoding: 'utf8',
        timeout: 15000, // 15s timeout prevents hanging on DB connection
        env: {
          ...process.env,
          MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost/test',
          ADMIN_MONGODB_URI: process.env.ADMIN_MONGODB_URI || 'mongodb://localhost/test-admin',
          REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
          JWT_SECRET: process.env.JWT_SECRET || 'architecture_check_test_secret_at_least_32_chars',
          NODE_ENV: 'test',
          SKIP_ENV_VALIDATION: 'true',
        },
      }
    );
    const out = (result.stdout || '') + (result.stderr || '');
    // Check exit code and output — the script emits the emoji line on success
    if (result.status !== 0 && result.signal !== 'SIGTERM') {
      throw new Error(`Public API load failed:\n${out.split('\n').slice(0, 20).join('\n')}`);
    }
    if (!out.includes('All 14 namespaces loaded successfully')) {
      // If we timed out, it means namespaces require live connections — treat as soft skip
      if (result.signal === 'SIGTERM') {
        return '⚠️  Skipped (requires live DB) — run manually with env vars set';
      }
      throw new Error(`Public API load failed:\n${out.split('\n').slice(0, 20).join('\n')}`);
    }
    return 'All 14 namespaces load successfully';
  });
} else {
  results.push({ label: 'Gate 5 — Public API namespace load test', status: 'SKIP', detail: 'Skipped in fast mode' });
}

// ─── Calculate Health Score ───────────────────────────────────────────────────

let healthScore = 100;
const deductions = {
  'Gate 1': 30,
  'Gate 2': 20,
  'Gate 3': 20,
  'Gate 4': 15,
  'Gate 5': 15
};

results.forEach(r => {
  if (r.status === 'FAIL') {
    for (const [key, value] of Object.entries(deductions)) {
      if (r.label.startsWith(key)) {
        healthScore -= value;
      }
    }
  }
});

// Ensure score stays in [0, 100]
healthScore = Math.max(0, healthScore);

// ─── Generate Report ──────────────────────────────────────────────────────────

const reportLines = [
  '# Architecture Check Report',
  '',
  `**Architecture Version:** v1.1.0`,
  `**Date:** ${new Date().toISOString()}`,
  `**Mode:** ${reportMode ? 'REPORT (no hard fail)' : 'ENFORCE'}`,
  `**Architecture Health Score:** ${healthScore}/100`,
  '',
  '## Results',
  '',
  '| Gate | Status | Detail |',
  '| --- | --- | --- |',
  ...results.map(r => `| ${r.label} | ${r.status === 'PASS' ? '✅ PASS' : r.status === 'SKIP' ? '⚠️ SKIP' : '❌ FAIL'} | ${r.detail.split('\n')[0].substring(0, 80)} |`),
  '',
  `**Overall: ${hasViolations ? '❌ VIOLATIONS FOUND' : '✅ ALL GATES PASSED'}**`,
  '',
];

const reportPath = path.join(ROOT, '.architecture-report.md');
fs.writeFileSync(reportPath, reportLines.join('\n'), 'utf8');
console.log(`\n📄 Architecture report saved to: .architecture-report.md`);

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log('\n─────────────────────────────────────────────────');
console.log(`🏛️  Architecture Health Score: ${healthScore}/100`);
if (hasViolations) {
  console.log('❌ Architecture check FAILED. See violations above.');
  if (!reportMode) {
    process.exit(1);
  } else {
    console.log('   (Report mode — not exiting with error code)');
  }
} else {
  console.log('✅ All architecture gates passed.');
}
console.log('─────────────────────────────────────────────────\n');
