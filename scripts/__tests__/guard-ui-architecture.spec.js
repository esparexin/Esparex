const fs = require('fs');
const path = require('path');
const os = require('os');
const { auditFile, RULES, detectViewportAffix, detectViewportPairs } = require('../guard-ui-architecture');

function runTests() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-guard-test-'));
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

  try {
    console.log('Testing guard-ui-architecture rules...\n');

    // 1. MUST FAIL: Parallel responsive DOM subtrees with md:hidden and hidden md:block
    const f1 = path.join(tmpDir, 'ParallelBad.tsx');
    fs.writeFileSync(
      f1,
      `export function ParallelBad() {
  return (
    <div>
      <div className="hidden md:block">Desktop Table</div>
      <div className="md:hidden">Mobile List</div>
    </div>
  );
}`
    );
    const v1 = auditFile(f1);
    const parallelViolation = v1.find((v) => v.rule.id === RULES.PARALLEL_RESPONSIVE.id);
    assert(Boolean(parallelViolation), 'Fails on parallel DOM subtrees using md:hidden and hidden md:block');

    // 2. MUST PASS: Parallel responsive DOM with ui-guard-ignore
    const f2 = path.join(tmpDir, 'ParallelIgnored.tsx');
    fs.writeFileSync(
      f2,
      `/* ui-guard-ignore: parallel-responsive-dom [Documented shell chrome split] */
export function ParallelIgnored() {
  return (
    <div>
      <div className="hidden md:block">Desktop Table</div>
      <div className="md:hidden">Mobile List</div>
    </div>
  );
}`
    );
    const v2 = auditFile(f2);
    const ignoredViolation = v2.find((v) => v.rule.id === RULES.PARALLEL_RESPONSIVE.id);
    assert(!ignoredViolation, 'Passes parallel DOM subtrees when ui-guard-ignore is present');

    // 3. MUST FAIL: Viewport-split component file naming (*DesktopTable.tsx)
    const f3 = path.join(tmpDir, 'OrderDesktopTable.tsx');
    fs.writeFileSync(
      f3,
      `export function OrderDesktopTable() {
  return <table><tbody><tr><td>Data</td></tr></tbody></table>;
}`
    );
    const v3 = auditFile(f3);
    const namingViolation = v3.find((v) => v.rule.id === RULES.VIEWPORT_COMPONENT_FORBIDDEN.id);
    assert(Boolean(namingViolation), 'Fails on viewport-split component file naming (*DesktopTable.tsx)');

    // 4. MUST PASS: Clean single-instance responsive component
    const f4 = path.join(tmpDir, 'CleanCard.tsx');
    fs.writeFileSync(
      f4,
      `export function CleanCard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="p-4 border rounded">Content</div>
    </div>
  );
}`
    );
    const v4 = auditFile(f4);
    // 5. MUST FAIL: Multi-breakpoint detection (sm:hidden and hidden sm:block)
    const f5 = path.join(tmpDir, 'SmParallelBad.tsx');
    fs.writeFileSync(
      f5,
      `export function SmParallelBad() {
  return (
    <div>
      <div className="hidden sm:block">Tablet View</div>
      <div className="sm:hidden">Phone View</div>
    </div>
  );
}`
    );
    const v5 = auditFile(f5);
    const smParallelViolation = v5.find((v) => v.rule.id === RULES.PARALLEL_RESPONSIVE.id);
    assert(Boolean(smParallelViolation), 'Fails on parallel DOM subtrees using sm:hidden and hidden sm:block');

    // 6. MUST PASS: Responsive table column hiding (hidden sm:table-cell is not a parallel container)
    const f6 = path.join(tmpDir, 'ResponsiveTable.tsx');
    fs.writeFileSync(
      f6,
      `export function ResponsiveTable() {
  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th className="hidden sm:table-cell">Details</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Item 1 <span className="sm:hidden">(inline info)</span></td>
          <td className="hidden sm:table-cell">Full info</td>
        </tr>
      </tbody>
    </table>
  );
}`
    );
    const v6 = auditFile(f6);
    const tableViolation = v6.find((v) => v.rule.id === RULES.PARALLEL_RESPONSIVE.id);
    assert(!tableViolation, 'Passes responsive table column progressive disclosure (hidden sm:table-cell)');

    // 7. MUST FAIL: ui-guard-ignore waiver missing justification
    const f7 = path.join(tmpDir, 'BadWaiver.tsx');
    fs.writeFileSync(
      f7,
      `/* ui-guard-ignore: parallel-responsive-dom */
export function BadWaiver() {
  return <div>Test</div>;
}`
    );
    const v7 = auditFile(f7);
    const waiverViolation = v7.find((v) => v.rule.id === RULES.WAIVER_SYNTAX.id);
    assert(Boolean(waiverViolation), 'Fails when ui-guard-ignore waiver is missing mandatory justification');

    console.log(`\nTests completed: ${passed} passed, ${failed} failed.`);
    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

function runViewportPairTests() {
  // DECISION-GATE C-6 regression tests: general affix detector + pair detection.
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-guard-pair-test-'));
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

  try {
    console.log('\nTesting viewport affix detector + pair detection (C-6)...\n');
    const write = (name) => {
      const f = path.join(tmpDir, name);
      fs.writeFileSync(f, `export function X() { return <div/>; }\n`);
      return f;
    };

    // 1. General affix detector catches affixes the old regex missed (Tablet).
    assert(detectViewportAffix('OrderTabletCard') === 'Tablet', 'Affix detector flags Tablet segment (OrderTabletCard)');
    assert(detectViewportAffix('HelpPhonePanel') === 'Phone', 'Affix detector flags Phone segment (HelpPhonePanel)');
    assert(detectViewportAffix('CleanCard') === null, 'Affix detector ignores affix-free names (CleanCard)');
    assert(detectViewportAffix('SmartAlertMatches') === null, 'Affix detector ignores non-affix prefixes (SmartAlertMatches)');

    // 2. Complementary pair in the same directory -> both paired (blocking error shape).
    const d1 = write('WidgetDesktop.tsx');
    const m1 = write('WidgetMobile.tsx');
    const paired = detectViewportPairs([d1, m1]);
    assert(paired.has(d1) && paired.has(m1), 'Pair detection flags WidgetDesktop + WidgetMobile in the same directory');

    // 3. Affixed + bare stem in the same directory -> pair.
    const b1 = write('Panel.tsx');
    const b2 = write('PanelMobile.tsx');
    const pairedBare = detectViewportPairs([b1, b2]);
    assert(pairedBare.has(b1) && pairedBare.has(b2), 'Pair detection flags PanelMobile + bare Panel stem');

    // 4. Lone affix -> no pair (warning-only shape, not blocking).
    const solo = write('SoloMobile.tsx');
    assert(detectViewportPairs([solo]).size === 0, 'Lone affix (SoloMobile) forms no pair');

    // 5. Same affix twice is not a pair; different directories are not a pair.
    const s1 = write('CardMobile.tsx');
    const otherDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-guard-pair-other-'));
    const o1 = path.join(otherDir, 'CardDesktop.tsx');
    fs.writeFileSync(o1, `export function X() { return <div/>; }\n`);
    assert(detectViewportPairs([s1, s1]).size === 0, 'Identical file listed twice forms no pair');
    assert(detectViewportPairs([s1, o1]).size === 0, 'Same-stem affixes in different directories form no pair');
    fs.rmSync(otherDir, { recursive: true, force: true });

    // 6. auditFile still records the violation for affixed names (error shape preserved for direct callers).
    const vAffix = auditFile(write('OrderTabletCard.tsx'));
    assert(
      vAffix.some((v) => v.rule.id === RULES.VIEWPORT_COMPONENT_FORBIDDEN.id),
      'auditFile records viewport-component-forbidden for Tablet-affixed names'
    );

    console.log(`\nPair tests completed: ${passed} passed, ${failed} failed.`);
    if (failed > 0) process.exit(1);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

runTests();
runViewportPairTests();
