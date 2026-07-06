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
    const allowedBranches = rulesConfig.allowedBranches || ["main", "master", "develop", "feature/transport-separation-pr2"];

    if (payload) {
      if (!payload.isClean) {
        violations.push({
          ruleId: "dirty-working-tree",
          severity: "warning",
          message: `Workspace contains ${payload.uncommittedFiles.length} uncommitted modifications. Run git status to inspect.`
        });
      }

      if (payload.currentBranch && !allowedBranches.includes(payload.currentBranch)) {
        violations.push({
          ruleId: "disallowed-branch-name",
          severity: "info",
          message: `Current branch '${payload.currentBranch}' is not in the allowed branch whitelist: ${allowedBranches.join(", ")}`
        });
      }
    }

    let score = 100;
    if (violations.some(v => v.severity === "warning")) score -= 10;
    if (violations.some(v => v.severity === "error")) score -= 30;

    return {
      schemaVersion: "1.0.0",
      analyzerId: envelope.analyzerId,
      score,
      violations,
      passed: !violations.some(v => v.severity === "error" || v.severity === "critical")
    };
  }
}
