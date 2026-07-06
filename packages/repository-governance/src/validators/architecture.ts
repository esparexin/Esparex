import { Validator, AnalysisResultEnvelope, ValidationReport, RuleViolation } from "../types/index.js";
import { ArchitectureAnalysisPayload } from "../types/index.js";

export class ArchitectureValidator implements Validator<ArchitectureAnalysisPayload> {
  id = "architecture-validator";
  name = "Architecture Governance Validator";

  async validate(
    envelope: AnalysisResultEnvelope<ArchitectureAnalysisPayload>,
    rulesConfig: Record<string, any>
  ): Promise<ValidationReport> {
    const violations: RuleViolation[] = [];
    const payload = envelope.payload;

    // Load weights from config, fallback to default spec weights
    const weights = rulesConfig.weights || {
      deepImports: 30,
      circular: 20,
      boundaryCore: 20,
      boundaryBackend: 15,
      publicApi: 15
    };

    let score = 100;

    if (payload) {
      // 1. Deep Imports
      if (!payload.deepImports.passed) {
        score -= weights.deepImports;
        violations.push({
          ruleId: "deep-imports-forbidden",
          severity: "error",
          message: `Deep import violations found: ${payload.deepImports.filesFound.length} files imports internal core subpaths directly instead of via the public barrel exports.`,
          metadata: { files: payload.deepImports.filesFound }
        });
      }

      // 2. Circular Dependencies
      if (!payload.circular.passed) {
        score -= weights.circular;
        violations.push({
          ruleId: "circular-dependencies-forbidden",
          severity: "error",
          message: `Circular dependency violations found: Madge detected ${payload.circular.cycles.length} cycles inside core/src.`,
          metadata: { cycles: payload.circular.cycles }
        });
      }

      // 3. Boundary Core Checks
      if (!payload.boundaryCore.passed) {
        score -= weights.boundaryCore;
        violations.push({
          ruleId: "architecture-boundary-violation-core",
          severity: "error",
          message: `Core architectural boundaries violated:\n${payload.boundaryCore.errorOutput || ""}`
        });
      }

      // 4. Boundary Backend Checks
      if (!payload.boundaryBackend.passed) {
        score -= weights.boundaryBackend;
        violations.push({
          ruleId: "architecture-boundary-violation-backend",
          severity: "error",
          message: `Backend architectural boundaries violated:\n${payload.boundaryBackend.errorOutput || ""}`
        });
      }

      // 5. Public API Namespace Load Test
      if (!payload.publicApi.passed) {
        score -= weights.publicApi;
        violations.push({
          ruleId: "public-api-namespace-load-failure",
          severity: "error",
          message: `Public API namespaces failed to load successfully:\n${payload.publicApi.outputLog || ""}`
        });
      }
    }

    score = Math.max(0, score);

    return {
      schemaVersion: "1.0.0",
      analyzerId: envelope.analyzerId,
      score,
      violations,
      passed: violations.length === 0
    };
  }
}
