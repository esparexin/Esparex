const {
  matchHighRisk,
  scanAddedLines,
  scanNewFilePath,
  parseDeclaredScope,
  evaluateScope,
  detectOscillation,
  hasScopeEvidence,
  hasScopeOverride,
} = require('../git/esparex/scope-ownership-validator');

const HIGH_RISK = [
  'packages/ui/**',
  'apps/web/src/components/auth/**',
  'apps/web/src/context/**',
  'apps/web/src/hooks/useVisualViewport.ts',
  'apps/web/src/lib/api/client.ts',
];

const GOOD_EVIDENCE = [
  'SCOPE-CONTRACT: narrow login popup fix.',
  'High-Risk Touched: apps/web/src/components/auth/AuthModal.tsx',
  'Ownership Evidence: Sheet owns scroll; AuthModalContext owns sheet.',
  'Blast Radius: mobile, keyboard, scroll.',
  'Regression Rows: open/close PASS, home_scrolling PASS.',
  'Declared Files:',
  '- apps/web/src/components/auth/AuthModal.tsx',
].join('\n');

function runTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✗ ${message}`);
      failed++;
    }
  }

  // A — Narrow local change: PASS (no high-risk, no second owner).
  assert(
    evaluateScope({ changedFiles: ['apps/web/src/components/user/ProfileCard.tsx'], newFiles: [], highRiskTouched: [], evidenceText: '' }).errors.length === 0,
    'A: narrow local change passes with no high-risk files touched'
  );
  assert(
    scanAddedLines('apps/web/src/components/user/ProfileCard.tsx', ['const x = 1;']).length === 0,
    'A: clean added lines produce no second-owner violations'
  );

  // B — Narrow request modifies unrelated shared owner: FAIL.
  assert(
    scanAddedLines('apps/web/src/components/auth/AuthModal.tsx', ['fixed inset-0 top-0 bottom-0']).length === 1,
    'B: fullscreen override in AuthModal fails (shared keyboard contract)'
  );
  assert(
    scanAddedLines('apps/web/src/hooks/useVisualViewport.ts', ['document.body.style.position = "fixed";']).length === 1,
    'B: second scroll-lock writer fails (Radix owns scroll lock)'
  );
  assert(
    scanAddedLines('apps/web/src/components/user/ProfileCard.tsx', ['pb-[var(--keyboard-height,0px)]']).length === 1,
    'B: second keyboard-height compensator fails (Sheet + viewport hook own it)'
  );
  assert(
    evaluateScope({
      changedFiles: ['packages/ui/src/feedback/Sheet.tsx'],
      newFiles: [],
      highRiskTouched: ['packages/ui/src/feedback/Sheet.tsx'],
      evidenceText: 'fix popup',
    }).errors.length === 1,
    'B: high-risk shared file without evidence fails'
  );

  // C — Shared owner changed with valid evidence: PASS.
  assert(
    evaluateScope({
      changedFiles: ['apps/web/src/components/auth/AuthModal.tsx'],
      newFiles: [],
      highRiskTouched: ['apps/web/src/components/auth/AuthModal.tsx'],
      evidenceText: GOOD_EVIDENCE,
    }).errors.length === 0,
    'C: high-risk change with scope-contract evidence passes'
  );
  assert(
    evaluateScope({
      changedFiles: ['packages/ui/src/feedback/Sheet.tsx'],
      newFiles: [],
      highRiskTouched: ['packages/ui/src/feedback/Sheet.tsx'],
      evidenceText: 'SCOPE-OVERRIDE: shared primitive fix. why_this_owner: Radix wrapper owns it. consumers_checked: 4 sheets. blast_radius: modal only. regression_coverage: sheet specs PASS.',
    }).errors.length === 0,
    'C: legitimate shared-owner override passes'
  );

  // D — New competing owner: FAIL when mechanically provable.
  assert(scanNewFilePath('packages/ui/src/feedback/sheetScrollLock.ts') !== null, 'D: resurrected sheetScrollLock module fails');
  assert(
    scanAddedLines('apps/web/src/components/user/ReportAdDialog.tsx', ['openSheet("auth")']).length === 1,
    'D: second auth-sheet owner fails (AuthModalContext owns it)'
  );
  assert(
    scanAddedLines('apps/web/src/lib/authHelpers.ts', ["if (url.includes('auth/send-otp')) retry();"]).length === 1,
    'D: second OTP/retry matcher fails (lib/api/client owns it)'
  );
  assert(
    scanAddedLines('apps/web/src/lib/api/client.ts', ["if (url.includes('auth/send-otp')) retry();"]).length === 0,
    'D: canonical retry owner itself does not fail'
  );

  // E — Declared scope differs from actual diff: FAIL.
  assert(
    evaluateScope({
      changedFiles: ['apps/web/src/components/auth/AuthModal.tsx', 'packages/ui/src/feedback/Sheet.tsx'],
      newFiles: [],
      highRiskTouched: ['apps/web/src/components/auth/AuthModal.tsx', 'packages/ui/src/feedback/Sheet.tsx'],
      evidenceText: `${GOOD_EVIDENCE}`,
    }).errors.length === 1,
    'E: undeclared shared file in actual diff fails scope check'
  );

  // F — Required regression row missing: FAIL without regression evidence.
  assert(!hasScopeEvidence('SCOPE-CONTRACT + High-Risk + Blast without the final gate word.'), 'F: evidence missing regression rows fails');
  assert(hasScopeEvidence(GOOD_EVIDENCE), 'F: evidence with regression rows passes');
  assert(
    Object.keys(detectOscillation({})).length === 0 &&
      detectOscillation({ 'packages/ui/src/feedback/Sheet.tsx': 3 }).length === 1,
    'F/oscillation: repeat-touch on same high-risk owner warns'
  );

  // Registry + helpers sanity.
  assert(matchHighRisk('packages/ui/src/feedback/Sheet.tsx', HIGH_RISK), 'high-risk matcher covers shared primitives');
  assert(!matchHighRisk('apps/web/src/components/user/ProfileCard.tsx', HIGH_RISK), 'high-risk matcher ignores local files');
  assert(parseDeclaredScope(GOOD_EVIDENCE).length === 1, 'declared scope parser extracts listed files');
  assert(hasScopeOverride('scope-override with why_this_owner and regression coverage'), 'override detector accepts full override');

  console.log(`\nScope Ownership Validator Tests: ${passed} passed, ${failed} failed.`);
  if (failed > 0) throw new Error(`Scope Ownership Validator Tests failed: ${failed}`);
}

if (typeof describe === 'function') {
  describe('scope-ownership-validator', () => {
    it('enforces narrow-scope ownership controls (A-F)', () => {
      runTests();
    });
  });
} else {
  runTests();
}
