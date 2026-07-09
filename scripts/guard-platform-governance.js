#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const baselinePath = path.join(repoRoot, 'scripts', 'policy', 'legacy-js-risk-allowlist.json');

const EXCLUDED_DIRS = new Set(['node_modules', 'dist', '.next', 'coverage']);

const DB_CONNECT_PATTERN = /(mongoose\.connect|MongoClient\(|new\s+MongoClient\(|client\.db\(|connectDB\()/i;
const DB_MUTATION_PATTERN = /(updateOne\(|updateMany\(|findOneAndUpdate\(|bulkWrite\(|insertOne\(|insertMany\(|deleteOne\(|deleteMany\(|replaceOne\(|createIndex\(|dropIndex\(|renameCollection\()/;
const STATUS_MUTATION_PATTERN = /(status\s*[:=]|moderationStatus\s*[:=]|expiresAt\b|resolvedAt\b|approved|rejected|pending|active|suspended|dismissed)/i;
const MIGRATION_SHADOW_NAME_PATTERN = /backend\/user\/scripts\/.*(migrate|remediate|repair|cleanup).+\.js$/;

const FORBIDDEN_SW_FILES = [
  'apps/web/firebase-messaging-sw.js',
  'apps/web/firebase-messaging-sw.template.js',
  'apps/web/public/firebase-messaging-sw-dynamic.js',
];

const readBaseline = () => {
  if (!fs.existsSync(baselinePath)) {
    throw new Error(`Missing baseline allowlist: ${path.relative(repoRoot, baselinePath)}`);
  }
  return JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
};

const SCRIPT_EXTENSIONS = new Set(['.js', '.cjs', '.mjs']);

const walkScriptFiles = (dir, relativePrefix = '') => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out = [];

  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;
    if (entry.name.startsWith('.')) {
      if (entry.name !== '.github') continue;
    }

    const relPath = relativePrefix ? `${relativePrefix}/${entry.name}` : entry.name;
    const absPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      out.push(...walkScriptFiles(absPath, relPath));
      continue;
    }

    if (!entry.isFile()) continue;
    
    // Always yield map and d.ts files for artifact detection
    if (entry.name.endsWith('.js.map') || entry.name.endsWith('.d.ts')) {
        out.push(relPath);
        continue;
    }

    if (!SCRIPT_EXTENSIONS.has(path.extname(entry.name))) continue;
    out.push(relPath);
  }

  return out;
};

const failIfAny = (title, files, failures) => {
  if (files.length === 0) return;
  failures.push(`${title}\n${files.map((file) => `  - ${file}`).join('\n')}`);
};

const main = () => {
  const baseline = readBaseline();
  const files = walkScriptFiles(repoRoot);
  const failures = [];

  const riskyJsMutationFiles = [];
  const lifecycleBypassFiles = [];
  const migrationShadowFiles = [];
  const frontendDbMutationFiles = [];
  const staleArtifactFiles = [];

  for (const file of files) {
    const abs = path.join(repoRoot, file);
    const content = fs.readFileSync(abs, 'utf8');
    const isMigration = file.startsWith('backend/user/migrations/');
    const hasDbRisk = DB_CONNECT_PATTERN.test(content) && DB_MUTATION_PATTERN.test(content);

    if (hasDbRisk && !isMigration) {
      riskyJsMutationFiles.push(file);
      if (file.startsWith('apps/web/scripts/')) {
        frontendDbMutationFiles.push(file);
      }
    }

    if (!isMigration && DB_MUTATION_PATTERN.test(content) && STATUS_MUTATION_PATTERN.test(content)) {
      lifecycleBypassFiles.push(file);
    }

    if (MIGRATION_SHADOW_NAME_PATTERN.test(file) && hasDbRisk) {
      migrationShadowFiles.push(file);
    }

    if (file.includes('/src/') || file.startsWith('src/')) {
      if ((file.endsWith('.js') || file.endsWith('.js.map') || file.endsWith('.d.ts')) && !file.endsWith('.config.js') && !file.endsWith('jest.globalTeardown.js')) {
        staleArtifactFiles.push(file);
      }
    }
  }

  const unknownRisky = riskyJsMutationFiles.filter(
    (file) => !baseline.dbMutationShadowScripts.includes(file)
  );
  const unknownLifecycleBypass = lifecycleBypassFiles.filter(
    (file) => !baseline.lifecycleBypassScripts.includes(file)
  );
  const unknownMigrationShadow = migrationShadowFiles.filter(
    (file) => !baseline.migrationShadowScripts.includes(file)
  );

  failIfAny('New JS DB mutation scripts detected outside tracked migrations:', unknownRisky, failures);
  failIfAny('Frontend repository contains DB mutation scripts (forbidden):', frontendDbMutationFiles, failures);
  failIfAny('New lifecycle bypass JS mutations detected:', unknownLifecycleBypass, failures);
  failIfAny('New migration shadow scripts detected in backend/user/scripts:', unknownMigrationShadow, failures);
  failIfAny('Compiled artifacts detected inside source directories (forbidden):', staleArtifactFiles, failures);

  const forbiddenSwFound = FORBIDDEN_SW_FILES.filter((file) => fs.existsSync(path.join(repoRoot, file)));
  failIfAny('Forbidden service worker files detected (must keep single SW strategy):', forbiddenSwFound, failures);

  if (failures.length > 0) {
    console.error('❌ Platform governance guard failed.');
    for (const failure of failures) {
      console.error(`\n${failure}`);
    }
    console.error('\n💡 HINT: JS-based database mutations outside of backend/user/migrations/ bypass audit trails and lifecycle hooks.');
    console.error('   Action: Move logic to a Mongoose migration. If this is a one-off repair, add the script to the allowlist');
    console.error('   in scripts/policy/legacy-js-risk-allowlist.json ONLY after senior review.');
    process.exit(1);
  }

  console.log('✅ Platform governance guard passed.');
  console.log(`- Legacy JS DB mutation scripts (baseline tracked): ${riskyJsMutationFiles.length}`);
  console.log(`- Lifecycle bypass scripts (baseline tracked): ${lifecycleBypassFiles.length}`);
  console.log(`- Migration shadow scripts (baseline tracked): ${migrationShadowFiles.length}`);
};

main();
