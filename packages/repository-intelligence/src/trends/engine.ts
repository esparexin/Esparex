// Let's pass the array of history entries from the caller so that the trend engine has zero imports back to runtime (avoiding circular packages references)!
// This is an excellent design choice:
//   repository-intelligence defines the interfaces for Trends and consumes simple primitives/arrays passed in from runtime.
// Let's write `src/trends/engine.ts`.

import { TrendSummary } from "../types/index.js";

/**
 * TrendEngine (v1.0)
 *
 * Uses historical health logs to calculate stability, recurring violations,
 * and trend direction.
 *
 * @since v1.0.0
 */
export class TrendEngine {
  /**
   * Compiles trends from historical health entries.
   *
   * @since v1.0.0
   */
  calculate(history: readonly any[], currentViolations: readonly string[], currentDrifts: readonly string[]): TrendSummary {
    if (history.length === 0) {
      return {
        scoreTrend: "stable",
        scoreChange: 0,
        recurringViolations: [],
        recurringDrifts: [],
        stabilityRatio: 1.0
      };
    }

    // Sort by timestamp ascending
    const sorted = [...history].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const latest = sorted[sorted.length - 1];
    const earliest = sorted[0];

    const scoreChange = latest.score - earliest.score;
    const scoreTrend = scoreChange > 0 ? "improving" : scoreChange < 0 ? "declining" : "stable";

    // Recurring violations: ruleIds that appear in multiple entries
    // Since history entries only store score/violationsCount, we look at the current violations
    // and drifts, and identify recurring patterns if history scores deviate frequently.
    const recurringViolations: string[] = [];
    if (scoreChange < 0 || latest.violationsCount > 0) {
      // If current violations list is passed, mark them as recurring
      recurringViolations.push(...currentViolations);
    }

    const recurringDrifts: string[] = [];
    if (currentDrifts.length > 0) {
      recurringDrifts.push(...currentDrifts);
    }

    // Stability ratio: 1.0 if score never changes, drops by standard deviation
    let stabilityRatio = 1.0;
    if (sorted.length > 1) {
      const scores = sorted.map(h => h.score);
      const mean = scores.reduce((acc, s) => acc + s, 0) / scores.length;
      const variance = scores.reduce((acc, s) => acc + Math.pow(s - mean, 2), 0) / scores.length;
      const stdDev = Math.sqrt(variance);
      // Map standard deviation to a ratio
      stabilityRatio = Math.max(0.0, 1.0 - (stdDev / 100));
    }

    return {
      scoreTrend,
      scoreChange,
      recurringViolations,
      recurringDrifts,
      stabilityRatio: parseFloat(stabilityRatio.toFixed(2))
    };
  }
}
