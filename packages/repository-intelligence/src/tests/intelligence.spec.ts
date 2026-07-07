import * as assert from "assert";
import {
  RecommendationEngine,
  RepositoryHealthEngine,
  TechnicalDebtEngine,
  TrendEngine,
  RepositoryMemory
} from "../index.js";

function pass(name: string) { console.log(`  ✔ PASS: ${name}`); }
function fail(name: string, err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`  ✖ FAIL: ${name} — ${msg}`);
  process.exitCode = 1;
}

async function runTests() {
  console.log("--------------------------------------------------");
  console.log("Running @esparex/repository-intelligence unit tests...");
  console.log("--------------------------------------------------\n");

  // Mock inputs for testing
  const mockSnapshot: any = {
    repository: {
      files: ["apps/web/src/components/Button.tsx", "backend/user/src/controllers/UserController.ts", "scripts/orphan-script.ts"]
    },
    technology: {
      next: "^16.0.6",
      express: "^5.2.1",
      redis: "^4.0.0"
    },
    architecture: {
      ownership: {
        "apps/web": "Presentation Layer",
        "backend/user": "Transport Layer"
      }
    }
  };

  const mockGovernanceReport: any = {
    results: [
      {
        ruleId: "naming-convention-violation",
        passed: false,
        violationsCount: 2,
        report: {
          violations: [
            { ruleId: "naming-convention-violation", message: "Variable name must be camelCase: 'My_Db_Model'" },
            { ruleId: "naming-convention-violation", message: "File name must be PascalCase: 'user_controller.ts'" }
          ]
        }
      },
      {
        ruleId: "ARCH-004-boundary",
        passed: false,
        violationsCount: 1,
        report: {
          violations: [
            { ruleId: "ARCH-004-boundary", message: "Presentation Layer cannot import Domain directly" }
          ]
        }
      }
    ]
  };

  const mockDriftFindings = [
    { id: "technology-changed-express", severity: "warning", category: "dependency", message: "Dependency changed" },
    { id: "workspace-removed-admin", severity: "error", category: "workspace", message: "Workspace removed" }
  ];

  // ═══════════════════════════════════════════════════════════════════════
  // 1. TechnicalDebtEngine Tests
  // ═══════════════════════════════════════════════════════════════════════
  console.log("1. TechnicalDebtEngine checks");

  try {
    const engine = new TechnicalDebtEngine();
    const summary = await engine.evaluate(mockSnapshot, mockGovernanceReport);

    assert.ok(summary, "Returns TechnicalDebtSummary");
    assert.strictEqual(summary.duplicateCodeBlocksCount, 0, "No duplicate code blocks");
    
    // In our mock, redis is declared, but it is not linked to active workspace prefixes apps/web or backend/user
    assert.deepStrictEqual(summary.staleDependencies, ["redis"], "redis is identified as stale dependency");
    
    // scripts/orphan-script.ts doesn't start with apps/web or backend/user prefixes
    assert.deepStrictEqual(summary.orphanFiles, ["scripts/orphan-script.ts"], "scripts/orphan-script.ts is flagged as orphan file");
    
    assert.ok(summary.score < 100, "Debt score is lower than 100 on violations");
    pass("TechnicalDebtEngine aggregates debt metrics cleanly without directory scanning");
  } catch (e) { fail("TechnicalDebtEngine tests", e); }

  // ═══════════════════════════════════════════════════════════════════════
  // 2. RepositoryHealthEngine Tests
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n2. RepositoryHealthEngine checks");

  try {
    const engine = new RepositoryHealthEngine();
    
    // 40% governance, 30% drift, 30% tech-debt
    // 0.4 * 80 + 0.3 * 90 + 0.3 * 70 = 32 + 27 + 21 = 80
    const summary = engine.calculate(80, 90, 70);
    
    assert.strictEqual(summary.score, 80, "Composite score calculation aligns with weights");
    assert.strictEqual(summary.status, "healthy", "Score 80 is healthy");
    
    const badSummary = engine.calculate(50, 60, 50);
    assert.strictEqual(badSummary.status, "error", "Composite score 52 is error");
    pass("RepositoryHealthEngine compiles multi-dimensional health stats correctly");
  } catch (e) { fail("RepositoryHealthEngine tests", e); }

  // ═══════════════════════════════════════════════════════════════════════
  // 3. TrendEngine Tests
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n3. TrendEngine checks");

  try {
    const engine = new TrendEngine();
    const history = [
      { timestamp: "2026-07-01T00:00:00Z", score: 70, violationsCount: 5 },
      { timestamp: "2026-07-02T00:00:00Z", score: 85, violationsCount: 2 }
    ];

    const currentViolations = ["naming-convention-violation"];
    const currentDrifts = ["drift-dep-redis"];

    const summary = engine.calculate(history, currentViolations, currentDrifts);
    
    assert.strictEqual(summary.scoreTrend, "improving", "Score direction should be improving");
    assert.strictEqual(summary.scoreChange, 15, "Score delta change is +15");
    assert.deepStrictEqual(summary.recurringViolations, ["naming-convention-violation"], "Captures recurring violations");
    assert.ok(summary.stabilityRatio < 1.0, "Stability ratio reflects scores fluctuations");
    
    pass("TrendEngine calculates stable indexes and recurring rule paths correctly");
  } catch (e) { fail("TrendEngine tests", e); }

  // ═══════════════════════════════════════════════════════════════════════
  // 4. RecommendationEngine Tests
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n4. RecommendationEngine checks");

  try {
    const engine = new RecommendationEngine();
    const debt = {
      score: 80,
      duplicateCodeBlocksCount: 0,
      staleDependencies: ["redis"],
      orphanFiles: ["orphan-script.ts"],
      deprecatedApiCount: 0
    };

    const violations = [
      { ruleId: "naming-convention-violation", message: "Naming casing error" },
      { ruleId: "ARCH-004-boundary", message: "Boundary cross imports error" }
    ];

    const recs = engine.generate(violations, mockDriftFindings, debt);
    assert.ok(recs.length > 0, "Recommendations list contains items");
    
    // Finds specific recommendations
    const namingRec = recs.find(r => r.id.startsWith("rec-naming"));
    const archRec = recs.find(r => r.id.startsWith("rec-arch"));
    const staleRec = recs.find(r => r.id === "rec-debt-stale-dependencies");
    const workspaceRec = recs.find(r => r.id.startsWith("rec-drift-workspace"));

    assert.ok(namingRec, "Forms naming convention recommendation");
    assert.ok(archRec, "Forms architecture boundary recommendation");
    assert.strictEqual(archRec.priority, "high", "Architecture rule violations carry high priority");
    assert.strictEqual(archRec.suggestedSkill, "layer-resolution", "Exposes correct suggested Skill mapping");
    
    assert.ok(staleRec, "Forms stale dependency recommendation");
    assert.ok(workspaceRec, "Forms workspace list drift recommendation");
    assert.strictEqual(workspaceRec.priority, "critical", "Workspace deletion drifts carry critical priority");

    pass("RecommendationEngine translates findings evidence into prioritized Skill actions");
  } catch (e) { fail("RecommendationEngine tests", e); }

  console.log("\n--------------------------------------------------");
  console.log("All @esparex/repository-intelligence tests completed!");
  console.log("--------------------------------------------------\n");
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
