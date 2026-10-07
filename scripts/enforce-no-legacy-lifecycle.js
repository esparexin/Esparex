#!/usr/bin/env node
/**
 * No-legacy-lifecycle guard (DECISION-GATE C-10).
 *
 * The legacy cluster core/src/services/lifecycle/ is consolidation-approved
 * for deletion (DECISION-GATE §4, P1-4) once its consumers migrate. Until then:
 *  - no NEW files may be added under core/src/services/lifecycle/
 *  - no NEW importers of services/lifecycle may appear
 *
 * The 5 remaining shims and their 16 live importers are grandfathered below;
 * both lists are burn-down lists — shrink them as the migration completes, and
 * delete this guard when the directory is gone.
 *
 * Exit 0 = no new files/imports. Exit 1 = lists the additions.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const LIFECYCLE_DIR = path.join(ROOT, 'core', 'src', 'services', 'lifecycle');

// Burn-down: remaining shims (delete entries as shims are removed).
const KNOWN_FILES = new Set([
  'core/src/services/lifecycle/AdStatusService.ts',
  'core/src/services/lifecycle/LifecycleGuard.ts',
  'core/src/services/lifecycle/LifecyclePolicyGuard.ts',
  'core/src/services/lifecycle/ListingExpiryService.ts',
  'core/src/services/lifecycle/StatusMutationService.ts',
]);

// Burn-down: live non-test importers (delete entries as imports migrate).
const KNOWN_IMPORTERS = new Set([
  'core/src/domains/analytics/application/services/ReportService.ts',
  'core/src/domains/identity/application/users/UserStatusService.ts',
  'core/src/domains/listings/application/ad/AdCreationService.ts',
  'core/src/domains/listings/application/ad/AdOrchestrator.ts',
  'core/src/domains/listings/application/ad/AdRepostService.ts',
  'core/src/domains/listings/application/ad/AdUpdateService.ts',
  'core/src/domains/listings/application/ad/_shared/adServiceBase.ts',
  'core/src/domains/listings/application/lifecycle/index.ts',
  'core/src/domains/listings/application/moderation/adminListings/mutations.ts',
  'core/src/domains/listings/application/mutations/AdMutationService.ts',
  'core/src/domains/moderation/pipeline/TextModerationService.ts',
  'core/src/events/listeners/NotificationTriggerListener.ts',
  'core/src/index.ts',
  'core/src/jobs/expireAds.job.ts',
  'core/src/utils/adFilterHelper.ts',
  'scripts/sweep-expired-listings.ts',
]);

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
