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
    assert(v4.length === 0, 'Passes clean single-instance responsive component');

    console.log(`\nTests completed: ${passed} passed, ${failed} failed.`);
    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

runTests();
