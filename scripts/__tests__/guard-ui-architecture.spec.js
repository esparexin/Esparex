const fs = require('fs');
const path = require('path');
const os = require('os');
const { auditFile, RULES } = require('../guard-ui-architecture');

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

runTests();
