import { GovernanceEngine } from "../engine/index.js";
import { calculateScore, calculateOverallScore } from "../scoring/index.js";
import { Analyzer, AnalyzerContext, AnalysisResultEnvelope, ValidationReport } from "../types/index.js";

function runTests() {
  console.log("Running @esparex/repository-governance Unit Tests...\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✔ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✖ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Dependency Resolution DAG Test
  try {
    const mockAnalyzerA: Analyzer = {
      metadata: { id: "A", name: "Analyzer A", category: "code-quality", version: "1.0.0", dependsOn: ["B"] },
      async run() { return {} as any; }
    };
    const mockAnalyzerB: Analyzer = {
      metadata: { id: "B", name: "Analyzer B", category: "code-quality", version: "1.0.0" },
      async run() { return {} as any; }
    };

    const resolved = GovernanceEngine.resolveDependencies([mockAnalyzerA, mockAnalyzerB]);
    assert((resolved[0] as Analyzer).metadata.id === "B" && (resolved[1] as Analyzer).metadata.id === "A", "Resolves dependencies in correct topological order");
  } catch (err: any) {
    assert(false, `Dependency resolution failed: ${err.message}`);
  }

  // 2. Circular Dependency Detection Test
  try {
    const mockAnalyzerA: Analyzer = {
      metadata: { id: "A", name: "Analyzer A", category: "code-quality", version: "1.0.0", dependsOn: ["B"] },
      async run() { return {} as any; }
    };
    const mockAnalyzerB: Analyzer = {
      metadata: { id: "B", name: "Analyzer B", category: "code-quality", version: "1.0.0", dependsOn: ["A"] },
      async run() { return {} as any; }
    };

    GovernanceEngine.resolveDependencies([mockAnalyzerA, mockAnalyzerB]);
    assert(false, "Fails to catch circular dependencies");
  } catch (err: any) {
    assert(err.message.includes("Circular dependency"), "Correctly detects circular dependencies");
  }

  // 3. Scoring Penalties Test
  try {
    const mockReport: ValidationReport = {
      schemaVersion: "1.0.0",
      analyzerId: "test",
      score: 100,
      violations: [
        { ruleId: "R1", severity: "warning", message: "warn" },
        { ruleId: "R2", severity: "error", message: "err" }
      ],
      passed: false
    };

    const score = calculateScore(mockReport);
    // Base 100 - (1 warning = 5) - (1 error = 15) = 80
    assert(score === 80, `Scoring penalty calculation matches expectation (Expected 80, got ${score})`);
  } catch (err: any) {
    assert(false, `Scoring test failed: ${err.message}`);
  }

  // 4. Overall Scoring calculation
  try {
    const overall = calculateOverallScore([{ score: 80 }, { score: 90 }]);
    assert(overall === 85, `Overall average score calculation works (Expected 85, got ${overall})`);
  } catch (err: any) {
    assert(false, `Overall score test failed: ${err.message}`);
  }

  console.log(`\nTests finished. Passed: ${passed} | Failed: ${failed}`);
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
