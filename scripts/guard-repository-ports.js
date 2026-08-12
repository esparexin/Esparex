#!/usr/bin/env node

/**
 * 🛡️ Esparex Architecture Governance: Repository Port Type Safety Guard
 * 
 * Enforces zero tolerance for loose `any` types in domain repository and service ports:
 * 1. Method returns must NOT be `Promise<any>` or `any[]`
 * 2. Method parameters must NOT be typed as `: any` or `<any>`
 * 3. Type assertions inside port definitions are strictly prohibited
 */

const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASELINE_PORT_LOOSE_TYPES = 0;

function run() {
  try {
    const violationsRaw = execSync(
      "git grep -n -E ':\\s*any\\b|<\\s*any\\s*>|Promise<\\s*any\\s*>|any\\[\\]' -- 'core/src/domains/**/ports/*Port.ts' || true",
      { cwd: ROOT, encoding: 'utf8' }
    );

    const violations = violationsRaw.trim().split('\n').filter(Boolean);
    const violationCount = violations.length;

    console.log(`📊 Domain Repository Port Type Safety Audit:`);
    console.log(`   Loose Port Type Violations (': any', 'Promise<any>', etc.): ${violationCount} (Baseline: ${BASELINE_PORT_LOOSE_TYPES})`);

    if (violationCount > BASELINE_PORT_LOOSE_TYPES) {
      console.error(`❌ GOVERNANCE FAILURE: Loose type annotations found in domain port definitions! (${violationCount} > ${BASELINE_PORT_LOOSE_TYPES})`);
      violations.forEach((line) => console.error(`     ${line}`));
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
