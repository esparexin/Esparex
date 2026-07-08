import type { BrainSnapshot } from "@esparex/repository-brain";
import { DriftFinding, DriftReport } from "../events/event-types.js";
import { ComparatorRegistry } from "./registry.js";

/**
 * DriftDetector
 *
 * Coordinates execution of all registered DriftComparators to generate a
 * complete structural and policy DriftReport.
 *
 * It NEVER performs filesystem scans or Git lookups. It compares the
 * previous snapshot (the cached/validated baseline) against the current snapshot
 * (the live scan of the repository compiled into a transient snapshot).
 */
export class DriftDetector {
  constructor(
    private readonly registry: ComparatorRegistry
  ) {}

  /**
   * Compare previous snapshot (baseline) vs current snapshot (live).
   * Compiles all findings, computes a health score, and checks for refresh requirements.
   */
  async detect(previous: BrainSnapshot, current: BrainSnapshot): Promise<DriftReport> {
    const findings: DriftFinding[] = [];

    for (const comparator of this.registry.list()) {
      try {
        const comparatorFindings = await comparator.compare(previous, current);
        findings.push(...comparatorFindings);
      } catch (err: any) {
        findings.push({
          id: `comparator-failure-${comparator.id}`,
          severity: "error",
          category: "filesystem",
          message: `Drift comparator "${comparator.id}" failed: ${err.message}`,
          recommendation: "Verify plugin configuration and package boundaries."
        });
      }
    }

    // Compute Health Score
    // Penalty rules:
    //   - info: 0 points
    //   - warning: 10 points
    //   - error: 30 points
    let score = 100;
    for (const finding of findings) {
      if (finding.severity === "error") {
        score -= 30;
      } else if (finding.severity === "warning") {
        score -= 10;
      }
    }
    score = Math.max(0, score);

    // If there are warnings or errors, the snapshots differ -> requires refresh.
    // Also requires refresh if metadata versions or commits do not match.
    const requiresSnapshotRefresh =
      score < 100 ||
      previous.metadata.inventoryHash !== current.metadata.inventoryHash ||
      previous.metadata.snapshotHash !== current.metadata.snapshotHash;

    const status = score === 100 ? "clean" : score >= 70 ? "warning" : "error";

    return {
      status,
      findings,
      score,
      requiresSnapshotRefresh,
      timestamp: new Date().toISOString()
    };
  }
}
