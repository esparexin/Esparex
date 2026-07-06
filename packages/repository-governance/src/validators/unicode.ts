import { Validator, AnalysisResultEnvelope, ValidationReport, RuleViolation } from "../types/index.js";
import { UnicodeViolationPayload } from "../analyzers/unicode.js";

export class UnicodeValidator implements Validator<UnicodeViolationPayload[]> {
  id = "unicode-hygiene-validator";
  name = "Unicode Hygiene Validator";

  async validate(
    envelope: AnalysisResultEnvelope<UnicodeViolationPayload[]>,
    rulesConfig: Record<string, any>
  ): Promise<ValidationReport> {
    const violations: RuleViolation[] = [];
    const payload = envelope.payload || [];

    for (const v of payload) {
      violations.push({
        ruleId: "forbidden-unicode-character",
        severity: "error",
        message: `Forbidden invisible character ${v.charName} (${v.unicode}) detected in file at ${v.file}:${v.line}:${v.col}`,
        file: v.file,
        line: v.line,
        col: v.col,
        metadata: { charName: v.charName, unicode: v.unicode, bytesHex: v.bytesHex }
      });
    }

    // Deduct score
    let score = 100 - (violations.length * 15);
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
