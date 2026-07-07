import { DriftFinding } from "../events/event_types.js";

/**
 * @since v1.0.0
 */
export interface ExplanationPayload {
  readonly ruleId: string;
  readonly category: string;
  readonly expected: string;
  readonly actual: string;
  readonly reason: string;
  readonly recommendation: string;
  toString(): string;
}

/**
 * ExplainabilityEngine
 *
 * Explains validation violations or drift findings in a clear,
 * developer-friendly structured model.
 *
 * @since v1.0.0
 */
export class ExplainabilityEngine {
  /**
   * Translates a violation or drift finding into a structured ExplanationPayload.
   *
   * @since v1.0.0
   */
  explain(result: any): ExplanationPayload {
    const isDrift = "category" in result && !("ruleId" in result);

    if (isDrift) {
      return this.explainDrift(result);
    }

    return this.explainViolation(result);
  }

  private explainDrift(finding: DriftFinding): ExplanationPayload {
    let expected = "Repository state matches baseline snapshot.";
    const actual = finding.message;
    let ruleId = "DRIFT-001";
    let recommendation = finding.recommendation || "Refresh baseline snapshot.";

    if (finding.id.startsWith("technology-changed")) {
      ruleId = "DRIFT-DEP-002";
      expected = "Package versions remain unchanged from approved baseline snapshot.";
      recommendation = "Review dependency version changes for breakages, then run 'refresh' to confirm changes.";
    } else if (finding.id.startsWith("workspace-removed")) {
      ruleId = "DRIFT-WS-003";
      expected = "Workspaces package map matches baseline structure.";
      recommendation = "Audit imports pointing to the removed workspace, or run 'refresh' if workspace deletion was intentional.";
    }

    return {
      ruleId,
      category: `drift:${finding.category}`,
      expected,
      actual,
      reason: "Repository state drifted from baseline snapshot.",
      recommendation,
      toString() {
        return `[Drift Rule ${this.ruleId}] ${this.reason}\n  Expected: ${this.expected}\n  Actual:   ${this.actual}\n  Rec:      ${this.recommendation}`;
      }
    };
  }

  private explainViolation(violation: any): ExplanationPayload {
    const ruleId = violation.ruleId || "RULE-001";
    let category = "governance";
    let expected = "Compliance with repository rules.";
    let actual = violation.message;
    let reason = "Governance compliance check failed.";
    let recommendation = "Review coding standards and import rules.";

    // 1. Architecture Layer Boundary violations (e.g. ARCH-004)
    if (ruleId.startsWith("ARCH") || ruleId.includes("boundary") || ruleId.includes("import")) {
      category = "architecture";
      reason = "Architecture Boundary Violation";
      expected = "Presentation Layer -> Transport Layer -> Business Domain -> Shared Library (Strict Downward Imports)";
      actual = violation.message;
      recommendation = "Move business logic/persistence calls into Domain Core Services; restrict deep packages imports.";
    }
    // 2. Unicode hygiene violations
    else if (ruleId.includes("unicode") || ruleId.includes("zwsp") || ruleId.includes("bom")) {
      category = "code-quality";
      reason = "Unicode Hygiene Check Failure";
      expected = "Clean source files (no invisible Zero Width Space characters or stray BOM markers).";
      recommendation = "Open file and remove invalid Unicode characters. Configure editor to strip BOM flags.";
    }
    // 3. Naming convention violations
    else if (ruleId.includes("naming") || ruleId.includes("casing")) {
      category = "coding-standards";
      reason = "Coding Naming Conventions Violation";
      expected = "camelCase variables, PascalCase classes/components, Plural API routes, Singular databases models.";
      recommendation = "Rename variables/files to match casing specifications. Refer to coding standards rules.";
    }

    return {
      ruleId,
      category,
      expected,
      actual,
      reason,
      recommendation,
      toString() {
        return `[Violation Rule ${this.ruleId}] ${this.reason}\n  Expected: ${this.expected}\n  Actual:   ${this.actual}\n  Rec:      ${this.recommendation}`;
      }
    };
  }
}
