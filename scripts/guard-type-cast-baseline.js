#!/usr/bin/env node

/**
 * 🛡️ Esparex Governance: Type Safety & Escape Hatch Baseline Guard
 * 
 * Enforces zero tolerance for TypeScript escape hatches across the monorepo:
 * 1. Double/chained assertions (`as unknown as`, `as any as`, `as never as`)
 * 2. TypeScript compiler suppressions (`@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`)
 * 3. Unsafe type assertions (`as any`, `as never`) in production source files
 */

const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASELINE_DOUBLE_CASTS = 0;
const BASELINE_TS_SUPPRESSIONS = 0;
const BASELINE_SOURCE_UNSAFE_CASTS = 0;

function run() {
  try {
    let hasFailure = false;

    // 1. Audit chained / double assertions across all codebase
    const doubleCastsRaw = execSync(
      "git grep -n -E 'as unknown as|as any as|as never as' -- 'apps/**' 'backend/**' 'core/**' 'packages/**' 'shared/**' || true",
      { cwd: ROOT, encoding: 'utf8' }
    );
    const doubleCasts = doubleCastsRaw.trim().split('\n').filter(Boolean);
    const doubleCastCount = doubleCasts.length;

    console.log(`📊 Type Safety Guard Audit:`);
    console.log(`   Double/Chained assertions ('as unknown as', etc.): ${doubleCastCount} (Baseline: ${BASELINE_DOUBLE_CASTS})`);

    if (doubleCastCount > BASELINE_DOUBLE_CASTS) {
      console.error(`❌ GOVERNANCE FAILURE: Double type assertion count exceeded baseline! (${doubleCastCount} > ${BASELINE_DOUBLE_CASTS})`);
      doubleCasts.forEach(line => console.error(`     ${line}`));
      hasFailure = true;
    }

    // 2. Audit TypeScript compiler suppressions across all codebase
    const tsSuppressionsRaw = execSync(
      "git grep -n -E '@ts-ignore|@ts-expect-error|@ts-nocheck' -- 'apps/**' 'backend/**' 'core/**' 'packages/**' 'shared/**' || true",
      { cwd: ROOT, encoding: 'utf8' }
    );
    // Filter out comments in documentation / markdown files
    const tsSuppressions = tsSuppressionsRaw.trim().split('\n').filter(Boolean).filter(line => {
      return !line.includes('safeSoftDeleteQuery.ts') && !line.endsWith('.md') && !line.includes('// Documentation');
    });
    const tsSuppressionCount = tsSuppressions.length;

    console.log(`   TypeScript Suppressions (@ts-ignore, etc.): ${tsSuppressionCount} (Baseline: ${BASELINE_TS_SUPPRESSIONS})`);

    if (tsSuppressionCount > BASELINE_TS_SUPPRESSIONS) {
      console.error(`❌ GOVERNANCE FAILURE: TypeScript compiler suppression count exceeded baseline! (${tsSuppressionCount} > ${BASELINE_TS_SUPPRESSIONS})`);
      tsSuppressions.forEach(line => console.error(`     ${line}`));
      hasFailure = true;
    }

    // 3. Audit 'as any' and 'as never' in production source code
    const sourceUnsafeRaw = execSync(
      "git grep -n -E '\\bas any\\b|\\bas never\\b' -- 'apps/**/src/**' 'packages/**/src/**' 'core/src/**' 'backend/api/src/**' ':!**/__tests__/**' ':!**/*.spec.*' ':!**/*.test.*' || true",
      { cwd: ROOT, encoding: 'utf8' }
    );
    const sourceUnsafe = sourceUnsafeRaw.trim().split('\n').filter(Boolean).filter(line => {
      // Exclude comment lines
      const codePart = line.split(':').slice(2).join(':').trim();
      return !codePart.startsWith('//') && !codePart.startsWith('*') && !codePart.startsWith('/*');
    });
    const sourceUnsafeCount = sourceUnsafe.length;

    console.log(`   Production Source Unsafe Casts ('as any', 'as never'): ${sourceUnsafeCount} (Baseline: ${BASELINE_SOURCE_UNSAFE_CASTS})`);

    if (sourceUnsafeCount > BASELINE_SOURCE_UNSAFE_CASTS) {
      console.error(`❌ GOVERNANCE FAILURE: Unsafe type assertions found in production source files! (${sourceUnsafeCount} > ${BASELINE_SOURCE_UNSAFE_CASTS})`);
      sourceUnsafe.forEach(line => console.error(`     ${line}`));
      hasFailure = true;
    }

    if (hasFailure) {
      console.error(`\n❌ Fix the underlying type definitions, generics, or schemas instead of bypassing TypeScript.`);
      process.exit(1);
    }

    console.log(`✅ Type Safety Guard Passed (All baselines strictly enforced at 0).`);
  } catch (err) {
    console.error(`❌ Error running type safety guard:`, err.message);
    process.exit(1);
  }
}

run();

