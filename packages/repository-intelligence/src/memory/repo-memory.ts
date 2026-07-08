import { RepositoryMemorySummary } from "../types/index.js";

/**
 * RepositoryMemory (v1.0)
 *
 * Exposes caching and memory maps evaluating recurring drift or
 * governance violations counts from history trends.
 *
 * @since v1.0.0
 */
export class RepositoryMemory {
  /**
   * Summarizes recurring violations and drifts counts from historical checks.
   *
   * @since v1.0.0
   */
  summarize(
    history: readonly any[],
    currentViolations: readonly string[],
    currentDrifts: readonly string[]
  ): RepositoryMemorySummary {
    const recurringViolationsCount: Record<string, number> = {};
    const recurringDriftsCount: Record<string, number> = {};

    // Populate counts based on current entries and historical iterations
    for (const ruleId of currentViolations) {
      recurringViolationsCount[ruleId] = (recurringViolationsCount[ruleId] || 0) + history.length + 1;
    }

    for (const driftId of currentDrifts) {
      recurringDriftsCount[driftId] = (recurringDriftsCount[driftId] || 0) + 1;
    }

    const historicalScores = history.map(h => h.score);

    return {
      recurringViolationsCount,
      recurringDriftsCount,
      historicalScores
    };
  }
}
