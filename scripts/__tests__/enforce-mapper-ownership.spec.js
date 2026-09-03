const fs = require('fs');
const path = require('path');
const os = require('os');
const { scanRepositoryFile, scanMapperFile } = require('../enforce-mapper-ownership');

function runTests() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mapper-guard-test-'));
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
    // 1. MUST FAIL: Repository constructs { formattedPrice: ... }
    const f1 = path.join(tmpDir, 'Repo1.ts');
    fs.writeFileSync(f1, `export class MongoListingRepository { async findAd() { return { id: '1', formattedPrice: '₹10,000' }; } }`);
    const v1 = scanRepositoryFile(f1);
    assert(v1.length === 1 && v1[0].type === 'forbidden-presentation-property', 'Fails when repository constructs formattedPrice');

    // 2. MUST FAIL: Repository calls formatPrice()
    const f2 = path.join(tmpDir, 'Repo2.ts');
    fs.writeFileSync(f2, `export class MongoListingRepository { async findAd() { const p = formatPrice(100); return { id: '1', price: p }; } }`);
    const v2 = scanRepositoryFile(f2);
    assert(v2.length === 1 && v2[0].type === 'forbidden-presentation-formatter', 'Fails when repository calls formatPrice()');

    // 3. MUST FAIL: Repository calls formatDate()
    const f3 = path.join(tmpDir, 'Repo3.ts');
    fs.writeFileSync(f3, `export class MongoUserRepository { async findUser() { const d = formatDate(new Date()); return { id: '1', d }; } }`);
    const v3 = scanRepositoryFile(f3);
    assert(v3.length === 1 && v3[0].type === 'forbidden-presentation-formatter', 'Fails when repository calls formatDate()');

    // 4. MUST FAIL: Mapper imports another Mapper
    const f4 = path.join(tmpDir, 'ListingMapper.ts');
    fs.writeFileSync(f4, `import { UserMapper } from './UserMapper';\nexport class ListingMapper {}`);
    const v4 = scanMapperFile(f4);
    assert(v4.length === 1 && v4[0].type === 'mapper-to-mapper-dependency', 'Fails when Mapper imports another Mapper');

    // 5. MUST PASS: Repository calls ListingMapper.toDomain()
    const f5 = path.join(tmpDir, 'RepoGood1.ts');
    fs.writeFileSync(f5, `export class MongoListingRepository { async findAd(id: string) { const doc = await Model.findById(id); return ListingMapper.toDomain(doc); } }`);
    const v5 = scanRepositoryFile(f5);
    assert(v5.length === 0, 'Passes when repository delegates to ListingMapper.toDomain()');

    // 6. MUST PASS: Repository returns { msgs, nextCursor } envelope
    const f6 = path.join(tmpDir, 'RepoGood2.ts');
    fs.writeFileSync(f6, `export class MongoChatRepository { async findMessages() { return { msgs: [], nextCursor: 'abc' }; } }`);
    const v6 = scanRepositoryFile(f6);
    assert(v6.length === 0, 'Passes when repository returns pagination cursor envelope');

    // 7. MUST PASS: Repository returns { user, business } persistence aggregate
    const f7 = path.join(tmpDir, 'RepoGood3.ts');
    fs.writeFileSync(f7, `export class MongoUserRepository { async getUserWithBusiness() { return { user: null, business: null }; } }`);
    const v7 = scanRepositoryFile(f7);
    assert(v7.length === 0, 'Passes when repository returns multi-collection persistence join');

    // 8. MUST PASS: Repository performs count / exists queries
    const f8 = path.join(tmpDir, 'RepoGood4.ts');
    fs.writeFileSync(f8, `export class MongoListingRepository { async count(query: any) { return await Model.countDocuments(query); } }`);
    const v8 = scanRepositoryFile(f8);
    assert(v8.length === 0, 'Passes when repository performs scalar count queries');

    console.log(`\nMapper Ownership Mutation Tests: ${passed} passed, ${failed} failed.`);
    if (failed > 0) throw new Error(`Mapper Ownership Mutation Tests failed: ${failed}`);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

if (typeof describe === 'function') {
  describe('enforce-mapper-ownership', () => {
    it('runs mapper ownership mutation tests cleanly', () => {
      runTests();
    });
  });
} else {
  runTests();
}
