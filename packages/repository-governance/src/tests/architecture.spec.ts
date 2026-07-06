import { ArchitectureValidator } from "../validators/architecture.js";
import { AnalysisResultEnvelope, ArchitectureAnalysisPayload, ValidationReport } from "../types/index.js";

function runArchitectureTests() {
  console.log("Running Architecture Governance Unit Tests...\n");

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

  const validator = new ArchitectureValidator();

  // Test 1: Full Pass Validation
  try {
    const envelope: AnalysisResultEnvelope<ArchitectureAnalysisPayload> = {
      schemaVersion: "1.0.0",
      analyzerId: "architecture",
      timestamp: new Date().toISOString(),
      status: "success",
      durationMs: 120,
      warningsCount: 0,
      errorsCount: 0,
      metadata: {},
      payload: {
        deepImports: { passed: true, filesFound: [] },
        circular: { passed: true, cycles: [] },
        boundaryCore: { passed: true },
        boundaryBackend: { passed: true },
        publicApi: { passed: true }
      }
    };

    const report = validator.validate(envelope, {});
    report.then(res => {
      assert(res.score === 100, "Clean architecture payload scores 100/100");
      assert(res.passed === true, "Clean architecture payload passes verification");
      assert(res.violations.length === 0, "Clean architecture payload generates zero violations");
    });
  } catch (err: any) {
    assert(false, `Test 1 failed: ${err.message}`);
  }

  // Test 2: Weight Penalty Calculation
  try {
    const envelope: AnalysisResultEnvelope<ArchitectureAnalysisPayload> = {
      schemaVersion: "1.0.0",
      analyzerId: "architecture",
      timestamp: new Date().toISOString(),
      status: "success",
      durationMs: 150,
      warningsCount: 0,
      errorsCount: 1,
      metadata: {},
      payload: {
        deepImports: { passed: false, filesFound: ["core/src/sub/file.ts"] }, // Weight 30
        circular: { passed: true, cycles: [] },
        boundaryCore: { passed: true },
        boundaryBackend: { passed: true },
        publicApi: { passed: true }
      }
    };

    const report = validator.validate(envelope, {});
    report.then(res => {
      assert(res.score === 70, `Default weight deduction for deepImports maps correctly (Expected 70, got ${res.score})`);
      assert(res.violations.length === 1, "Generates violation entry for deepImports");
      assert(res.violations[0].ruleId === "deep-imports-forbidden", "Creates correct ruleId mapping");
    });
  } catch (err: any) {
    assert(false, `Test 2 failed: ${err.message}`);
  }

  // Test 3: Custom Weight Overrides
  try {
    const envelope: AnalysisResultEnvelope<ArchitectureAnalysisPayload> = {
      schemaVersion: "1.0.0",
      analyzerId: "architecture",
      timestamp: new Date().toISOString(),
      status: "success",
      durationMs: 150,
      warningsCount: 0,
      errorsCount: 1,
      metadata: {},
      payload: {
        deepImports: { passed: false, filesFound: ["core/src/sub/file.ts"] },
        circular: { passed: true, cycles: [] },
        boundaryCore: { passed: true },
        boundaryBackend: { passed: true },
        publicApi: { passed: true }
      }
    };

    const customConfig = {
      weights: {
        deepImports: 50
      }
    };

    const report = validator.validate(envelope, customConfig);
    report.then(res => {
      assert(res.score === 50, `Custom weight override penalty matches calculation (Expected 50, got ${res.score})`);
    });
  } catch (err: any) {
    assert(false, `Test 3 failed: ${err.message}`);
  }
}

// Keep process active briefly for promises to resolve
setTimeout(() => {
  runArchitectureTests();
}, 50);
