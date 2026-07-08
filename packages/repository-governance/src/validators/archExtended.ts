import { Validator, AnalysisResultEnvelope, ValidationReport, RuleViolation } from "../types/index.js";
import { ObservabilityViolation } from "../analyzers/architecture/observability.js";
import { DTOGovernanceViolation } from "../analyzers/architecture/dtoGovernance.js";
import { AppRouterLayoutViolation } from "../analyzers/architecture/appRouterLayout.js";
import { DriftPreventionViolation } from "../analyzers/architecture/driftPrevention.js";

export class ObservabilityValidator implements Validator<ObservabilityViolation[]> {
  id = "observability";
  name = "Observability Isolation Validator";

  async validate(
    envelope: AnalysisResultEnvelope<ObservabilityViolation[]>,
    rulesConfig: Record<string, any>
  ): Promise<ValidationReport> {
    const violations: RuleViolation[] = [];
    const payload = envelope.payload || [];
    let score = 100;

    for (const v of payload) {
      violations.push({
        ruleId: "observability-isolation",
        severity: v.severity,
        message: v.message,
        file: v.file,
        line: v.line
      });
      score -= 20;
    }

    return {
      schemaVersion: "1.0.0",
      analyzerId: envelope.analyzerId,
      score: Math.max(0, score),
      violations,
      passed: violations.length === 0
    };
  }
}

export class DTOGovernanceValidator implements Validator<DTOGovernanceViolation[]> {
  id = "dto-governance";
  name = "DTO Governance Validator";

  async validate(
    envelope: AnalysisResultEnvelope<DTOGovernanceViolation[]>,
    rulesConfig: Record<string, any>
  ): Promise<ValidationReport> {
    const violations: RuleViolation[] = [];
    const payload = envelope.payload || [];
    let score = 100;

    for (const v of payload) {
      violations.push({
        ruleId: "dto-governance",
        severity: v.severity,
        message: v.message,
        file: v.file
      });
      score -= 25;
    }

    return {
      schemaVersion: "1.0.0",
      analyzerId: envelope.analyzerId,
      score: Math.max(0, score),
      violations,
      passed: violations.length === 0
    };
  }
}

export class AppRouterLayoutValidator implements Validator<AppRouterLayoutViolation[]> {
  id = "app-router-layout";
  name = "App Router Layout Safety Validator";

  async validate(
    envelope: AnalysisResultEnvelope<AppRouterLayoutViolation[]>,
    rulesConfig: Record<string, any>
  ): Promise<ValidationReport> {
    const violations: RuleViolation[] = [];
    const payload = envelope.payload || [];
    let score = 100;

    for (const v of payload) {
      violations.push({
        ruleId: v.severity === "warning"
          ? "app-router-layout-nesting-depth"
          : "app-router-layout-children-outlet",
        severity: v.severity,
        message: v.message,
        file: v.file
      });
      score -= v.severity === "warning" ? 20 : 5;
    }

    return {
      schemaVersion: "1.0.0",
      analyzerId: envelope.analyzerId,
      score: Math.max(0, score),
      violations,
      passed: violations.length === 0
    };
  }
}

export class DriftPreventionValidator implements Validator<DriftPreventionViolation[]> {
  id = "drift-prevention";
  name = "Validation Drift Prevention Validator";

  async validate(
    envelope: AnalysisResultEnvelope<DriftPreventionViolation[]>,
    rulesConfig: Record<string, any>
  ): Promise<ValidationReport> {
    const violations: RuleViolation[] = [];
    const payload = envelope.payload || [];
    let score = 100;

    for (const v of payload) {
      violations.push({
        ruleId: "validation-drift-prevention",
        severity: v.severity,
        message: v.message,
        file: v.file
      });
      score -= 10;
    }

    return {
      schemaVersion: "1.0.0",
      analyzerId: envelope.analyzerId,
      score: Math.max(0, score),
      violations,
      passed: violations.length === 0
    };
  }
}
