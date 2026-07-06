import { Validator, AnalysisResultEnvelope, ValidationReport, RuleViolation } from "../types/index.js";
import { EnvStatusPayload } from "../analyzers/env.js";

export class EnvValidator implements Validator<EnvStatusPayload> {
  id = "env-validator";
  name = "Environment Validator";

  async validate(
    envelope: AnalysisResultEnvelope<EnvStatusPayload>,
    rulesConfig: Record<string, any>
  ): Promise<ValidationReport> {
    const violations: RuleViolation[] = [];
    const payload = envelope.payload;

    if (payload) {
      if (!payload.rootEnvExists && !payload.rootEnvExampleExists) {
        violations.push({
          ruleId: "missing-root-env",
          severity: "warning",
          message: "Root environment configuration (.env or .env.example) is missing."
        });
      }
      if (!payload.appAdminEnvExists) {
        violations.push({
          ruleId: "missing-admin-env",
          severity: "warning",
          message: "Admin workspace environment config (apps/admin/.env) is missing."
        });
      }
      if (!payload.appWebEnvExists) {
        violations.push({
          ruleId: "missing-web-env",
          severity: "warning",
          message: "Web workspace environment config (apps/web/.env) is missing."
        });
      }
    }

    let score = 100;
    if (violations.length > 0) {
      score -= (violations.length * 10);
    }

    return {
      schemaVersion: "1.0.0",
      analyzerId: envelope.analyzerId,
      score,
      violations,
      passed: true // Envs are warnings, does not block pipelines absolutely unless strict
    };
  }
}
