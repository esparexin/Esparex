#!/usr/bin/env node

/**
 * NEW FILE JUSTIFICATION
 * ----------------------
 * Repository Search Completed:
 *   - scripts/guard-repository-hygiene.js (root junk files, tracked gitignored files — no docs counting)
 *   - scripts/git/esparex/auditor-validator.js (validates audit-reports/repository-audit.json freshness — no docs sprawl cap)
 *   - scripts/enforce-agents-ssot.js (required docs tracked — no new-file gate)
 * Reason: No existing guard caps docs/*.md growth or allowlists audit-reports/
 * outputs per AGENTS.md Documentation Hygiene (5 Master SSOT Pillars).
 * Decision: New file approved (governance consolidation EA).
 *
 * Doc Hygiene Ratchet (AGENTS.md Documentation Hygiene):
 * 1. docs/ markdown count must not exceed DOC_BASELINE. To add a doc, include a
 *    New File Justification and bump DOC_BASELINE in the same change.
 * 2. audit-reports/ may contain only canonical generator outputs.
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const DOC_BASELINE = 65;

const AUDIT_REPORTS_ALLOWLIST = new Set([
  'repository-audit.json',
  'repository-audit.md',
  'repository-audit-summary.md',
  'jscpd-report.json',
]);

const countMarkdown = (dir) => {
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      count += countMarkdown(abs);
    } else if (entry.name.endsWith('.md')) {
      count += 1;
    }
  }
  return count;
};

const main = () => {
  const failures = [];
  const docsDir = path.join(repoRoot, 'docs');

  if (fs.existsSync(docsDir)) {
    const count = countMarkdown(docsDir);
    if (count > DOC_BASELINE) {
      failures.push(
        `docs/ markdown sprawl: ${count} files exceed baseline ${DOC_BASELINE}. ` +
        `Add a New File Justification and bump DOC_BASELINE in scripts/guard-doc-hygiene.js in the same change.`
      );
    } else {
      console.log(`- docs/ markdown files: ${count} (baseline ${DOC_BASELINE})`);
    }
  }

  const auditReportsDir = path.join(repoRoot, 'audit-reports');
  if (fs.existsSync(auditReportsDir)) {
    for (const entry of fs.readdirSync(auditReportsDir)) {
      if (entry.startsWith('.')) continue;
      if (!AUDIT_REPORTS_ALLOWLIST.has(entry)) {
        failures.push(
          `audit-reports/${entry} is not a canonical generator output ` +
          `(${[...AUDIT_REPORTS_ALLOWLIST].join(', ')}). AGENTS.md bans ad-hoc files here.`
        );
      }
    }
  }

  if (failures.length > 0) {
    console.error('❌ Doc hygiene guard failed.');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }
  console.log('✅ Doc hygiene guard passed.');
};

main();
