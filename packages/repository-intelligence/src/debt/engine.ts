import type { BrainSnapshot } from "@esparex/repository-brain";
import { TechnicalDebtSummary } from "../types/index.js";

/**
 * TechnicalDebtEngine (v1.0)
 *
 * Enforces the Intelligence Evidence Rule. It does not scan the filesystem
 * itself or execute raw checks. It aggregates evidence from BrainSnapshot and
 * Governance logs to compile a TechnicalDebtSummary.
 *
 * @since v1.0.0
 */
export class TechnicalDebtEngine {
  /**
   * Aggregates technical debt metrics from snapshot details and governance results.
   *
   * @since v1.0.0
   */
  async evaluate(snapshot: BrainSnapshot, governanceReport?: any): Promise<TechnicalDebtSummary> {
    // 1. Identify stale dependencies: technologies in package.json/snapshot that are not
    // referenced in active architectural layer configurations.
    const activeLayers = new Set(
      Object.keys(snapshot.architecture.ownership).map(k => k.split("/")[0])
    );
    const trackedFrameworks = Object.keys(snapshot.technology);
    const staleDependencies = trackedFrameworks.filter(fw => {
      // If a package (like razorpay or bullmq) is loaded but doesn't exist in our project layer boundaries
      // we consider it a candidate for cleanup.
      // For this reference engine, we simulate lookups:
      return fw === "redis" && !activeLayers.has("shared") && !activeLayers.has("core");
    });

    // 2. Count duplicate code blocks / configurations from policy exclusions or rules
    // Governance naming violations indicate coding standards debt.
    const violations = governanceReport?.results?.flatMap((r: any) => r.report.violations) || [];
    const namingViolations = violations.filter((v: any) => v.ruleId.includes("naming") || v.ruleId.includes("casing")).length;
    const duplicateCodeBlocksCount = violations.filter((v: any) => v.ruleId.includes("duplicate") || v.ruleId.includes("copy")).length;

    // 3. Find orphan files: tracked files in repository context that don't match layer ownership.
    const fileList = snapshot.repository.files;
    const ownershipPrefixes = Object.keys(snapshot.architecture.ownership);
    const orphanFiles = fileList.filter(file => {
      const normalized = file.replace(/\\/g, "/");
      return !ownershipPrefixes.some(prefix => normalized.startsWith(prefix)) && 
             !normalized.startsWith(".") && 
             normalized.includes("/");
    });

    // 4. Deprecated API occurrences (mock check based on naming conventions and legacy endpoints)
    const deprecatedApiCount = violations.filter((v: any) => v.severity === "warning" && v.ruleId.includes("deprecated")).length;

    // 5. Compute Tech Debt Score (starts at 100, drops by penalties)
    let score = 100;
    score -= namingViolations * 5;
    score -= duplicateCodeBlocksCount * 10;
    score -= staleDependencies.length * 10;
    score -= orphanFiles.length * 2;
    score = Math.max(0, score);

    return {
      score,
      duplicateCodeBlocksCount,
      staleDependencies,
      orphanFiles,
      deprecatedApiCount
    };
  }
}
