#!/usr/bin/env node

/**
 * 🛡️ Esparex Architecture Governance: Repository Port Type Safety Guard
 * 
 * Enforces zero tolerance for loose `any` types in domain repository and service ports:
 * 1. Method returns must NOT be `Promise<any>` or `any[]`
 * 2. Method parameters must NOT be typed as `: any` or `<any>`
 * 3. Type assertions inside port definitions are strictly prohibited
 *
 * DECISION-GATE C-16: also covers backend/api/src/seeds — seeds cross the
 * persistence boundary and must be strongly typed like ports.
 */

const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASELINE_PORT_LOOSE_TYPES = 0;

// DECISION-GATE C-16: seeds included alongside domain ports.
const SCAN_SCOPES = [
  { label: 'domain ports', pathspec: `'core/src/domains/**/ports/*Port.ts'` },
  { label: 'seeds', pathspec: `'backend/api/src/seeds/*.ts'` },
];

function run() {
  try {
    let violationCount = 0;
    const allLines = [];
    for (const scope of SCAN_SCOPES) {
      const violationsRaw = execSync(
        "git grep -n -E ':\\s*any\\b|<\\s*any\\s*>|Promise<\\s*any\\s*>|any\\[\\]' -- " + scope.pathspec + " || true",
        { cwd: ROOT, encoding: 'utf8' }
      );
      const violations = violationsRaw.trim().split('\n').filter(Boolean);
      violationCount += violations.length;
      for (const v of violations) allLines.push(`[${scope.label}] ${v}`);
    }

    console.log(`📊 Domain Repository Port Type Safety Audit:`);
    console.log(`   Loose Port Type Violations (': any', 'Promise<any>', etc.): ${violationCount} (Baseline: ${BASELINE_PORT_LOOSE_TYPES})`);

    if (violationCount > BASELINE_PORT_LOOSE_TYPES) {
      console.error(`❌ GOVERNANCE FAILURE: Loose type annotations found in domain port definitions! (${violationCount} > ${BASELINE_PORT_LOOSE_TYPES})`);
      allLines.forEach((line) => console.error(`     ${line}`));
      process.exit(1);
    }

    console.log(`✅ Repository Port Guard Passed: All domain repository ports are strongly typed with domain models & DTOs.`);
    process.exit(0);
  } catch (error) {
    console.error(`❌ Repository Port Guard Error:`, error.message);
    process.exit(1);
  }
}

run();
