/**
 * drift-detector.js
 * =================
 * Architecture Drift Detector (Architecture v1.1.0)
 *
 * Compares the Architecture Health Score of the current working tree
 * against a base Git commit (default: main) and fails if the score has decreased.
 *
 * Usage:
 *   node scripts/architecture/drift-detector.js --base=main
 */

'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const baseCommit = args.find(a => a.startsWith('--base='))?.split('=')[1] || 'main';

const ROOT = path.resolve(__dirname, '../..');
const TEMP_DIR = path.join(ROOT, 'node_modules', '.tmp-base-drift');

function getHealthScoreFromReport(reportPath) {
  if (!fs.existsSync(reportPath)) {
    return null;
  }
  const content = fs.readFileSync(reportPath, 'utf8');
  const match = content.match(/\*\*Architecture Health Score:\*\* (\d+)\/100/);
  return match ? parseInt(match[1], 10) : null;
}

function runArchitectureReport(dir, extraArgs = []) {
  const result = spawnSync(
    'node',
    [path.join(ROOT, 'scripts', 'architecture', 'check-architecture.js'), '--report', ...extraArgs],
    {
      cwd: dir,
      encoding: 'utf8',
      env: {
        ...process.env,
        MONGODB_URI: 'mongodb://localhost/test',
        ADMIN_MONGODB_URI: 'mongodb://localhost/test-admin',
        REDIS_URL: 'redis://localhost:6379',
        JWT_SECRET: 'architecture_check_test_secret_at_least_32_chars',
        NODE_ENV: 'test',
        SKIP_ENV_VALIDATION: 'true',
      }
    }
  );
  return result;
}

function main() {
  console.log(`\n======================================================`);
  console.log(`       Esparex Architecture Drift Detector           `);
  console.log(`       Base Commit: [${baseCommit}]                     `);
  console.log(`======================================================\n`);

  // 1. Get HEAD score
  let headScore = getHealthScoreFromReport(path.join(ROOT, '.architecture-report.md'));
  if (headScore === null) {
    console.log('Running architecture check on current branch (HEAD) to generate report...');
    runArchitectureReport(ROOT);
    headScore = getHealthScoreFromReport(path.join(ROOT, '.architecture-report.md'));
  }

  if (headScore === null) {
    console.error('❌ Could not read or generate architecture report for HEAD.');
    process.exit(1);
  }

  // 2. Extract base commit files to temp folder to run check on base
  console.log(`📦 Archiving and extracting base commit [${baseCommit}]...`);
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  const archivePath = path.join(ROOT, 'base-drift.zip');
  
  // Archive core/src, shared/src, scripts, and package files from baseCommit
  const gitArch = spawnSync(
    'git',
    ['archive', '--format=zip', '-o', archivePath, baseCommit, 'core', 'shared', 'scripts', 'package.json', 'tsconfig.json'],
    { cwd: ROOT, encoding: 'utf8' }
  );

  if (gitArch.status !== 0) {
    console.error(`❌ Failed to run git archive for base commit:`, gitArch.stderr);
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    process.exit(1);
  }

  const extract = spawnSync(
    'powershell',
    ['-Command', `Expand-Archive -Path "${archivePath}" -DestinationPath "${TEMP_DIR}" -Force`],
    { cwd: ROOT, encoding: 'utf8' }
  );

  if (fs.existsSync(archivePath)) {
    fs.unlinkSync(archivePath);
  }

  if (extract.status !== 0) {
    console.error(`❌ Failed to extract base commit archive:`, extract.stderr);
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    process.exit(1);
  }

  // 3. Run report on base commit
  console.log('Running architecture check on base commit...');
  // We copy the active check-architecture.js and matrix.js to the base folder
  // so we run the same rules against the base code.
  fs.mkdirSync(path.join(TEMP_DIR, 'scripts', 'architecture'), { recursive: true });
  fs.copyFileSync(
    path.join(ROOT, 'scripts', 'architecture', 'check-architecture.js'),
    path.join(TEMP_DIR, 'scripts', 'architecture', 'check-architecture.js')
  );
  fs.copyFileSync(
    path.join(ROOT, 'scripts', 'architecture', 'matrix.js'),
    path.join(TEMP_DIR, 'scripts', 'architecture', 'matrix.js')
  );
  if (fs.existsSync(path.join(ROOT, '.dependency-cruiser.cjs'))) {
    fs.copyFileSync(
      path.join(ROOT, '.dependency-cruiser.cjs'),
      path.join(TEMP_DIR, '.dependency-cruiser.cjs')
    );
  }

  runArchitectureReport(TEMP_DIR);
  const baseScore = getHealthScoreFromReport(path.join(TEMP_DIR, '.architecture-report.md'));

  // Clean up
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }

  if (baseScore === null) {
    console.warn(`⚠️  Could not calculate health score for base commit [${baseCommit}]. Assuming 100/100.`);
  }

  const finalBaseScore = baseScore !== null ? baseScore : 100;

  console.log(`\n======================= RESULTS =======================\n`);
  console.log(`🏛️  Base Commit Health Score: ${finalBaseScore}/100`);
  console.log(`🏛️  Current Branch Health Score: ${headScore}/100`);
  console.log(`──────────────────────────────────────────────────────`);

  if (headScore < finalBaseScore) {
    console.error(`❌ DRIFT DETECTED: Architecture Health degraded from ${finalBaseScore}/100 to ${headScore}/100!`);
    process.exit(1);
  } else {
    console.log(`✅ NO DRIFT: Architecture Health is stable or improved.`);
    process.exit(0);
  }
}

main();
