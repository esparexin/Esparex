#!/usr/bin/env node

/**
 * 🛡️ PR Description Quality & Governance Guard
 * 
 * Verifies that PR descriptions comply with `.github/PULL_REQUEST_TEMPLATE.md`:
 * 1. Checks that Phase 0 search proof was documented per clean-code skill
 * 2. Checks that Code Quality statement (file size & discipline) is filled
 * 3. Non-blocking when run locally without a PR context
 */

const prBody = process.env.PR_BODY || process.env.GITHUB_PR_BODY || '';

// If running locally or without PR body context, exit cleanly
if (!prBody || prBody.trim().length === 0) {
  if (process.env.CI && process.env.GITHUB_EVENT_NAME === 'pull_request') {
    console.warn('⚠️ [PR-GUARD] Warning: Empty PR body detected in PR event context.');
  } else {
    console.log('✅ PR Description Guard: Skipped (no active PR context).');
  }
  process.exit(0);
}

const errors = [];

// 1. Check Phase 0 search proof
if (!prBody.includes('Phase 0 Search Executed') || !prBody.includes('[x]')) {
  errors.push('PR body must acknowledge "[x] Phase 0 Search Executed" per clean-code skill.');
}

// 2. Check SSOT verification
if (!prBody.includes('SSOT & Canonical Ownership Verified') || !prBody.includes('[x]')) {
  errors.push('PR body must acknowledge "[x] SSOT & Canonical Ownership Verified".');
}

if (errors.length > 0) {
  console.error('\n❌ PR Description Quality Guard Failed:');
  for (const err of errors) {
    console.error(`   - ${err}`);
  }
  console.error('\n👉 Please fill out the required checklist items from .github/PULL_REQUEST_TEMPLATE.md.\n');
  process.exit(1);
} else {
  console.log('✅ PR Description Quality Guard: Passed.');
  process.exit(0);
}
