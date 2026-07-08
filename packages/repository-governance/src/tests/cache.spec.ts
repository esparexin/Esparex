import { AstCache } from "../engine/cache.js";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
  } else {
    console.error(`FAIL: ${message}`);
    failed++;
  }
}

// ── Test: cache miss on first access ──────────────────────────────────────
{
  const cache = new AstCache();
  let computeCount = 0;
  const result = cache.getOrCompute("file1.ts", "const x = 1;", () => {
    computeCount++;
    return { type: "Program" };
  });
  assert(result.type === "Program", "Cache miss returns computed value");
  assert(computeCount === 1, "Compute function called once on miss");
  assert(cache.stats.hits === 0, "No hits on first access");
  assert(cache.stats.misses === 1, "One miss on first access");
}

// ── Test: cache hit on repeated access with same content ──────────────────
{
  const cache = new AstCache();
  let computeCount = 0;
  cache.getOrCompute("file1.ts", "const x = 1;", () => {
    computeCount++;
    return { type: "Program" };
  });
  const result = cache.getOrCompute("file1.ts", "const x = 1;", () => {
    computeCount++;
    return { type: "Program" };
  });
  assert(result.type === "Program", "Cache hit returns cached value");
  assert(computeCount === 1, "Compute function not called on hit");
  assert(cache.stats.hits === 1, "One hit on repeat access");
  assert(cache.stats.misses === 1, "Still one miss total");
}

// ── Test: cache miss on content change ────────────────────────────────────
{
  const cache = new AstCache();
  let computeCount = 0;
  cache.getOrCompute("file1.ts", "const x = 1;", () => {
    computeCount++;
    return { type: "Program", value: 1 };
  });
  const result = cache.getOrCompute("file1.ts", "const x = 2;", () => {
    computeCount++;
    return { type: "Program", value: 2 };
  });
  assert(result.value === 2, "Content change triggers recompute");
  assert(computeCount === 2, "Compute called twice on content change");
  assert(cache.stats.hits === 0, "No hit on changed content");
  assert(cache.stats.misses === 2, "Two misses on content change");
}

// ── Test: invalidation clears entry ───────────────────────────────────────
{
  const cache = new AstCache();
  let computeCount = 0;
  cache.getOrCompute("file1.ts", "const x = 1;", () => {
    computeCount++;
    return { type: "Program" };
  });
  cache.invalidate("file1.ts");
  const result = cache.getOrCompute("file1.ts", "const x = 1;", () => {
    computeCount++;
    return { type: "Program" };
  });
  assert(result.type === "Program", "After invalidation, recomputes");
  assert(computeCount === 2, "Compute called again after invalidation");
}

// ── Test: clear resets all state ──────────────────────────────────────────
{
  const cache = new AstCache();
  cache.getOrCompute("file1.ts", "content", () => ({ type: "A" }));
  cache.getOrCompute("file2.ts", "content", () => ({ type: "B" }));
  assert(cache.stats.size === 2, "Two entries before clear");
  cache.clear();
  assert(cache.stats.size === 0, "Zero entries after clear");
  assert(cache.stats.hits === 0, "Hits reset after clear");
}

// ── Test: singleton instance ──────────────────────────────────────────────
{
  AstCache.resetInstance();
  const instance1 = AstCache.getInstance();
  const instance2 = AstCache.getInstance();
  assert(instance1 === instance2, "getInstance returns same instance");
  AstCache.resetInstance();
  const instance3 = AstCache.getInstance();
  assert(instance1 !== instance3, "After reset, new instance is different");
}

// ── Report ────────────────────────────────────────────────────────────────
console.log(`\nCache Tests: ${passed} passed, ${failed} failed out of ${passed + failed}`);
if (failed > 0) process.exit(1);
