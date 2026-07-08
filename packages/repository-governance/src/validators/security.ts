import { Validator, AnalysisResultEnvelope, ValidationReport, RuleViolation } from "../types/index.js";
import { SecureUploadViolation } from "../analyzers/security/secureUpload.js";
import { RBACCheckViolation } from "../analyzers/security/rbacCheck.js";

/**
 * Validates secure-upload analyzer results.
 * id matches envelope.analyzerId fallback for engine matching.
 */
export class SecureUploadValidator implements Validator<SecureUploadViolation[]> {
  id = "secure-upload";
  name = "Secure Upload Validator";

  async validate(
    envelope: AnalysisResultEnvelope<SecureUploadViolation[]>,
    rulesConfig: Record<string, any>
  ): Promise<ValidationReport> {
    const violations: RuleViolation[] = [];
    const payload = envelope.payload || [];
    let score = 100;

    for (const v of payload) {
      violations.push({
        ruleId: "secure-upload-handling",
        severity: v.severity,
        message: v.message,
        file: v.file
      });
      score -= 20;
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

/**
 * Validates rbac-check analyzer results.
 */
export class RBACCheckValidator implements Validator<RBACCheckViolation[]> {
  id = "rbac-check";
  name = "RBAC Authorization Validator";

  async validate(
    envelope: AnalysisResultEnvelope<RBACCheckViolation[]>,
    rulesConfig: Record<string, any>
  ): Promise<ValidationReport> {
    const violations: RuleViolation[] = [];
    const payload = envelope.payload || [];
    let score = 100;

    for (const v of payload) {
      violations.push({
        ruleId: "rbac-authorization-validation",
        severity: v.severity,
        message: v.message,
        file: v.file
      });
      score -= 25;
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
