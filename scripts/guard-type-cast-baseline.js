#!/usr/bin/env node

/**
 * 🛡️ Esparex Governance: Type Cast Baseline Guard
 * 
 * Prevents the erosion of TypeScript type discipline by ensuring that double type assertions
 * (`as unknown as T` or `as any as T`) do not exceed the established baseline.
 */

const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASELINE = 0; // Strict Zero Baseline: zero double assertions allowed repository-wide

function run() {
  try {
    const raw = execSync(
      "git grep -n -E 'as unknown as|as any as|as never as' -- 'apps/**' 'backend/**' 'core/**' 'packages/**' 'shared/**' || true",
      { cwd: ROOT, encoding: 'utf8' }
    );
    const lines = raw.trim().split('\n').filter(Boolean);
    const count = lines.length;

    console.log(`📊 Type Cast Guard Audit:`);
    console.log(`   Current 'as unknown as' instances: ${count}`);
    console.log(`   Maximum Allowed Baseline: ${BASELINE}`);

    if (count > BASELINE) {
      console.error(`❌ GOVERNANCE FAILURE: 'as unknown as' type cast count increased! (${count} > ${BASELINE})`);
      console.error(`   Do not use double type assertions ('as unknown as') to bypass TypeScript safety.`);
      process.exit(1);
    }

    console.log(`✅ Type Cast Guard Passed (${count}/${BASELINE}).`);
  } catch (err) {
    console.error(`❌ Error running type cast guard:`, err.message);
    process.exit(1);
  }
}

run();
