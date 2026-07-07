import { Validator, AnalysisResultEnvelope, ValidationReport, RuleViolation } from "../types/index.js";
import { GitStatusPayload } from "../analyzers/git.js";

export class GitValidator implements Validator<GitStatusPayload> {
  id = "git-validator";
  name = "Git Repository Validator";

  async validate(
    envelope: AnalysisResultEnvelope<GitStatusPayload>,
    rulesConfig: Record<string, any>
  ): Promise<ValidationReport> {
    const violations: RuleViolation[] = [];
    const payload = envelope.payload;
    const allowedBranches = rulesConfig.allowedBranches || ["main", "master", "develop"];

    if (payload) {
      // Branch allowlist check
      if (payload.currentBranch) {
        const isAllowed = allowedBranches.some((b: string) => 
          b.endsWith('*') ? payload.currentBranch!.startsWith(b.slice(0, -1)) : b === payload.currentBranch
        );
        if (!isAllowed) {
          violations.push({
            ruleId: "disallowed-branch-name",
            severity: "info",
            message: `Current branch '${payload.currentBranch}' is not in the allowed branch whitelist: ${allowedBranches.join(", ")}`
          });
        }
      }

      // NOTE: Dirty working-tree detection (uncommittedFiles) has been deferred
      // to Phase 7 (Drift Detection Engine). The scanner does not yet surface
      // live working-tree state; branch and commit are the only Git facts
      // available in the current BrainSnapshot.
    }

    let score = 100;
    if (violations.some(v => v.severity === "warning")) score -= 10;
    if (violations.some(v => v.severity === "error"))   score -= 30;

    return {
      schemaVersion: "1.0.0",
      analyzerId: envelope.analyzerId,
      score,
      violations,
      passed: !violations.some(v => v.severity === "error" || v.severity === "critical")
    };
  }
}
