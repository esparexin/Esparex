import { Validator, AnalysisResultEnvelope, ValidationReport, RuleViolation } from "../types/index.js";
import { FontLoadViolation } from "../analyzers/performance/fontLoading.js";
import { RenderBlockViolation } from "../analyzers/performance/renderBlocking.js";

/**
 * Validates font-loading analyzer results.
 */
export class FontLoadingValidator implements Validator<FontLoadViolation[]> {
  id = "font-loading";
  name = "Font Loading Validator";

  async validate(
    envelope: AnalysisResultEnvelope<FontLoadViolation[]>,
    rulesConfig: Record<string, any>
  ): Promise<ValidationReport> {
    const violations: RuleViolation[] = [];
    const payload = envelope.payload || [];
    let score = 100;

    for (const v of payload) {
      violations.push({
        ruleId: v.severity === "warning"
          ? "optimized-font-loading-external"
          : "optimized-font-loading-custom",
        severity: v.severity,
        message: v.message,
        file: v.file
      });
      score -= v.severity === "warning" ? 25 : 10;
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
 * Validates render-blocking analyzer results.
 */
export class RenderBlockingValidator implements Validator<RenderBlockViolation[]> {
  id = "render-blocking";
  name = "Render-Blocking Resource Validator";

  async validate(
    envelope: AnalysisResultEnvelope<RenderBlockViolation[]>,
    rulesConfig: Record<string, any>
  ): Promise<ValidationReport> {
    const violations: RuleViolation[] = [];
    const payload = envelope.payload || [];
    let score = 100;

    for (const v of payload) {
      violations.push({
        ruleId: "render-blocking-resource-detection",
        severity: v.severity,
        message: v.message,
        file: v.file,
        line: v.line
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
