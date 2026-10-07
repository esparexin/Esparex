#!/usr/bin/env node
/**
 * Phone-regex SSOT guard (DECISION-GATE C-15).
 *
 * There must be no SECOND PHONE_REGEX definition: phone-number detection is
 * canonical in shared/src/utils/phoneDetection.ts (single detectPhoneNumbers,
 * DECISION-GATE §3). Matches actual definitions
 * (`const PHONE_REGEX = ...`), not comment mentions.
 *
 * Allowlist (burn-down):
 *  - core/src/domains/communications/application/services/chat/ChatUtils.ts —
 *    dead ReDoS-flagged export, deletion landed separately (PR #671).
 *
 * Stale allowlist entries are warnings (not errors) so the guard stays green
 * as the burn-down completes; remove entries promptly.
 *
 * Exit 0 = no new PHONE_REGEX definition. Exit 1 = lists offending files.
 */

'use strict';

const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

const DEFINITION_PATTERN = '(export\\s+)?(const|let|var)\\s+PHONE_REGEX\\s*=';

const ALLOWLIST = new Set([
  // Dead export — deletion in PR #671; remove this entry after it lands.
  'core/src/domains/communications/application/services/chat/ChatUtils.ts',
]);

function main() {
  let out = '';
  try {
    out = execSync(
      `git grep -n -E "${DEFINITION_PATTERN}" -- 'core/src' 'backend/api/src' 'apps' 'packages' 'shared/src' || true`,
      { cwd: ROOT, encoding: 'utf-8' }
    );
  } catch {
    console.error('❌ C-15: git grep failed.');
    process.exit(1);
  }

  const hits = out.split('\n').filter(Boolean)
    .map((line) => line.split(':')[0])
    .filter((f) => !f.includes('__tests__') && !/\.spec\.[tj]sx?$/.test(f) && !/\.test\.[tj]sx?$/.test(f));
  const uniqueHits = [...new Set(hits)];

  const offenders = uniqueHits.filter((f) => !ALLOWLIST.has(f));

  for (const allowed of ALLOWLIST) {
    if (!uniqueHits.includes(allowed)) {
      console.warn(`⚠️  C-15: allowlist entry no longer defines PHONE_REGEX: ${allowed} — remove it from scripts/enforce-phone-regex-ssot.js.`);
    }
  }

  if (offenders.length > 0) {
    console.error('❌ C-15: new PHONE_REGEX definition(s) outside the allowlist:');
    for (const o of offenders) console.error(`   - ${o}`);
    console.error('   Phone-number detection is canonical in shared/src/utils/phoneDetection.ts — do not define a new PHONE_REGEX.');
    process.exit(1);
  }

  console.log(`✅ C-15: no new PHONE_REGEX definition (${uniqueHits.length} allowlisted, 0 new).`);
  process.exit(0);
}

if (require.main === module) main();

module.exports = { ALLOWLIST, DEFINITION_PATTERN };
