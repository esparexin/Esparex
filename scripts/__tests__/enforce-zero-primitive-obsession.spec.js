const fs = require('fs');
const path = require('path');
const os = require('os');
const { scanFile } = require('../enforce-zero-primitive-obsession');

function runTests() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'primitive-guard-test-'));
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
    // Case 1: Exported function with >3 primitives -> SHOULD DETECT
    const file1 = path.join(tmpDir, 'file1.ts');
    fs.writeFileSync(file1, `export function createSomething(a: string, b: string, c: number, d: boolean) { return true; }`);
    const v1 = scanFile(file1);
    assert(v1.length === 1 && v1[0].fnName === 'createSomething', 'Detects exported function with >3 primitives');

    // Case 2: Exported arrow function constant -> SHOULD DETECT
    const file2 = path.join(tmpDir, 'file2.ts');
    fs.writeFileSync(file2, `export const updateProfile = (name: string, email: string, phone: string, city: string) => { return true; };`);
    const v2 = scanFile(file2);
    assert(v2.length === 1 && v2[0].fnName === 'updateProfile', 'Detects exported arrow function constant with >3 primitives');

    // Case 3: Exported class public method -> SHOULD DETECT
    const file3 = path.join(tmpDir, 'file3.ts');
    fs.writeFileSync(file3, `export class UserService { public updateUser(id: string, name: string, age: number, active: boolean) { return true; } }`);
    const v3 = scanFile(file3);
    assert(v3.length === 1 && v3[0].fnName === 'UserService.updateUser', 'Detects exported class public method with >3 primitives');

    // Case 4: Private class method -> SHOULD NOT DETECT
    const file4 = path.join(tmpDir, 'file4.ts');
    fs.writeFileSync(file4, `export class InternalService { private helper(a: string, b: string, c: number, d: boolean) { return true; } }`);
    const v4 = scanFile(file4);
    assert(v4.length === 0, 'Ignores private class methods with >3 primitives');

    // Case 5: Internal unexported helper -> SHOULD NOT DETECT
    const file5 = path.join(tmpDir, 'file5.ts');
    fs.writeFileSync(file5, `function internalHelper(a: string, b: string, c: number, d: boolean) { return true; }`);
    const v5 = scanFile(file5);
    assert(v5.length === 0, 'Ignores internal unexported functions with >3 primitives');

    // Case 6: Function taking DTO / single options object -> SHOULD NOT DETECT
    const file6 = path.join(tmpDir, 'file6.ts');
    fs.writeFileSync(file6, `export function processListing(dto: { id: string; price: number; name: string; active: boolean }) { return true; }`);
    const v6 = scanFile(file6);
    assert(v6.length === 0, 'Allows single DTO/Options object parameter');

    // Case 7: Legitimate geospatial calculation -> SHOULD NOT DETECT
    const file7 = path.join(tmpDir, 'file7.ts');
    fs.writeFileSync(file7, `export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) { return 0; }`);
    const v7 = scanFile(file7);
    assert(v7.length === 0, 'Exempts legitimate geospatial/math calculation');

    // Case 8: Normal function with <=3 primitives -> SHOULD NOT DETECT
    const file8 = path.join(tmpDir, 'file8.ts');
    fs.writeFileSync(file8, `export function findUser(id: string, tenantId: string, active: boolean) { return true; }`);
    const v8 = scanFile(file8);
    assert(v8.length === 0, 'Allows functions with <= 3 primitive parameters');

    console.log(`\nPrimitive Obsession Mutation Tests: ${passed} passed, ${failed} failed.`);
    if (failed > 0) throw new Error(`Primitive Obsession Mutation Tests failed: ${failed}`);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

if (typeof describe === 'function') {
  describe('enforce-zero-primitive-obsession', () => {
    it('runs primitive obsession mutation tests cleanly', () => {
      runTests();
    });
  });
} else {
  runTests();
}
