import { Recommendation, TechnicalDebtSummary } from "../types/index.js";
import { DriftFinding } from "@esparex/repository-runtime"; // wait, import from types since we don't want runtime reference: we can pass DriftFinding[] from caller!
// Yes, we will pass DriftFinding[] and RuleViolation[] directly to the recommendation engine.

/**
 * RecommendationEngine (v1.0)
 *
 * Enforces the Intelligence Evidence Rule. It consumes drift findings,
 * governance violations, and technical debt summaries, converting them into
 * prioritized Recommendation actions mapping to Skills.
 *
 * @since v1.0.0
 */
export class RecommendationEngine {
  /**
   * Evaluates evidence findings to formulate actionable, prioritized recommendations.
   *
   * @since v1.0.0
   */
  generate(
    violations: readonly any[],
    driftFindings: readonly any[],
    debtSummary: TechnicalDebtSummary
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // 1. Evaluate Governance Violations
    for (const v of violations) {
      if (v.ruleId.includes("naming") || v.ruleId.includes("casing")) {
        recommendations.push({
          id: `rec-naming-${v.ruleId}`,
          title: "Align Identifier Casing to Coding Standards",
          category: "code-quality",
          severity: "warning",
          priority: "medium",
          confidence: 0.9,
          reason: `Governance flagged naming deviation: "${v.message}"`,
          evidence: `Rule violation ID: ${v.ruleId}`,
          recommendation: "Refactor files, classes, or database schemas to conform to camelCase/PascalCase naming casing standards.",
          estimatedEffortMin: 15,
          estimatedImpact: "medium"
        });
      } else if (v.ruleId.startsWith("ARCH")) {
        recommendations.push({
          id: `rec-arch-${v.ruleId}`,
          title: "Resolve Layer Dependency Rule Deviation",
          category: "architecture",
          severity: "error",
          priority: "high",
          confidence: 0.95,
          reason: `Governance flagged import boundary violation: "${v.message}"`,
          evidence: `Rule violation ID: ${v.ruleId}`,
          recommendation: "Refactor imports to respect clean architectural layer boundaries. Do not import layers upwards.",
          suggestedSkill: "layer-resolution",
          estimatedEffortMin: 45,
          estimatedImpact: "high"
        });
      }
    }

    // 2. Evaluate Drift Findings
    for (const d of driftFindings) {
      if (d.category === "dependency") {
        recommendations.push({
          id: `rec-drift-dependency-${d.id}`,
          title: "Reconcile Stale Package Versions",
          category: "dependency",
          severity: "warning",
          priority: "high",
          confidence: 0.85,
          reason: `Drift detected: "${d.message}"`,
          evidence: `Drift finding ID: ${d.id}`,
          recommendation: "Verify package dependency shifts, align versions, and run 'refresh' to rebuild snapshot baseline.",
          suggestedSkill: "technology-inspection",
          estimatedEffortMin: 20,
          estimatedImpact: "high"
        });
      } else if (d.category === "workspace") {
        recommendations.push({
          id: `rec-drift-workspace-${d.id}`,
          title: "Update Architecture Workspace Maps",
          category: "architecture",
          severity: "error",
          priority: "critical",
          confidence: 1.0,
          reason: `Workspace list drift: "${d.message}"`,
          evidence: `Drift finding ID: ${d.id}`,
          recommendation: "A workspace directory has been added or removed. Update config/architecture.json to assign boundaries.",
          suggestedSkill: "workspace-resolution",
          estimatedEffortMin: 10,
          estimatedImpact: "high"
        });
      }
    }

    // 3. Evaluate Technical Debt Aggregates
    if (debtSummary.staleDependencies.length > 0) {
      recommendations.push({
        id: "rec-debt-stale-dependencies",
        title: "Clean Stale Project Dependencies",
        category: "dependency",
        severity: "info",
        priority: "low",
        confidence: 0.8,
        reason: `${debtSummary.staleDependencies.length} stale dependencies detected.`,
        evidence: `Packages: ${debtSummary.staleDependencies.join(", ")}`,
        recommendation: "Remove unused dependencies from package.json files to optimize node_modules size.",
        suggestedSkill: "technology-inspection",
        estimatedEffortMin: 15,
        estimatedImpact: "low"
      });
    }

    return recommendations;
  }
}
