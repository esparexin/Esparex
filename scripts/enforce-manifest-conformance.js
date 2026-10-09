#!/usr/bin/env node
/**
 * Manifest conformance (DECISION-GATE C-12).
 *
 * Every domain in core/src/domains must be a real bounded context:
 *  1. Its public barrel (index.ts) must contain at least one export —
 *     an empty facade is a shell, not a domain.
 *  2. It must have an application/ layer — unless explicitly allowlisted.
 *
 * Both checks fail closed for NEW domains/shells; the allowlists below cover
 * the known transitional shells with gate-grounded reasons. Shrink the lists
 * as shells are merged or deleted (DECISION-GATE §2/§4).
 *
 * Exit 0 = conformant. Exit 1 = lists violations.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DOMAINS_DIR = path.join(ROOT, 'core', 'src', 'domains');

// Allowlist: domains whose public barrel is intentionally empty today.
const EMPTY_FACADE_ALLOWLIST = new Map([
  // (empty — every current domain barrel exports >=1 symbol)
]);

// Allowlist: domains without an application/ layer, with gate-grounded reasons.
const NO_APPLICATION_ALLOWLIST = new Map([
  ['admin', 'DECISION-GATE §3: short-term RETAIN shell (ports only); long-term extract admin/application/'],
  ['idempotency', 'ports + adapters only; application logic lives in the composition root'],
  ['location', 'ports only; location logic consolidated in core services'],
  ['moderation', 'pipeline/classifiers/policy live at domain root by design; no application/ layer'],
]);

const EXPORT_PATTERN = /^\s*export\s+(?:\*|{|\s*type\s+[{*]|default\b|async\s+function|function|const|let|var|class|interface|enum)/m;

function main() {
  const failures = [];
  const domains = fs.readdirSync(DOMAINS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  for (const domain of domains) {
    const dir = path.join(DOMAINS_DIR, domain);
    const indexTs = path.join(dir, 'index.ts');

    // Check 1: public barrel must not be an empty facade.
    let hasExport = false;
    if (fs.existsSync(indexTs)) {
      const content = fs.readFileSync(indexTs, 'utf-8');
      hasExport = EXPORT_PATTERN.test(content);
    }
    if (!hasExport && !EMPTY_FACADE_ALLOWLIST.has(domain)) {
      failures.push(`empty facade: core/src/domains/${domain}/index.ts has no exports (shell domain not allowlisted)`);
    }

    // Check 2: application/ layer must exist unless allowlisted.
    const hasApplication = fs.existsSync(path.join(dir, 'application'));
    if (!hasApplication && !NO_APPLICATION_ALLOWLIST.has(domain)) {
      failures.push(`no application/ layer: core/src/domains/${domain}/ (not allowlisted)`);
    }
  }

  // Allowlists must not rot: every entry must still apply.
  for (const domain of EMPTY_FACADE_ALLOWLIST.keys()) {
    if (!fs.existsSync(path.join(DOMAINS_DIR, domain))) {
      failures.push(`stale allowlist entry: domain "${domain}" no longer exists (EMPTY_FACADE_ALLOWLIST)`);
    }
  }
  for (const domain of NO_APPLICATION_ALLOWLIST.keys()) {
    const dir = path.join(DOMAINS_DIR, domain);
    if (!fs.existsSync(dir)) {
      failures.push(`stale allowlist entry: domain "${domain}" no longer exists (NO_APPLICATION_ALLOWLIST)`);
    } else if (fs.existsSync(path.join(dir, 'application'))) {
      failures.push(`stale allowlist entry: domain "${domain}" now has application/ (NO_APPLICATION_ALLOWLIST)`);
    }
  }

  if (failures.length > 0) {
    console.error('❌ C-12 manifest conformance violations:');
    for (const f of failures) console.error(`   - ${f}`);
    process.exit(1);
  }

  console.log(`✅ C-12 manifest conformance: ${domains.length} domains checked (empty-facade + application/ layer).`);
  process.exit(0);
}

if (require.main === module) main();

module.exports = { EMPTY_FACADE_ALLOWLIST, NO_APPLICATION_ALLOWLIST };
