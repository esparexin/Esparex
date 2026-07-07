import { IntelligenceHealthSummary } from "../types/index.js";

/**
 * RepositoryHealthEngine (v1.0)
 *
 * Compiles a multi-dimensional health score incorporating governance,
 * drift, and technical debt ratings.
 *
 * Weight allocation:
 *   - Governance: 40%
 *   - Drift: 30%
 *   - Technical Debt: 30%
 *
 * @since v1.0.0
 */
export class RepositoryHealthEngine {
  /**
   * Compiles the multi-dimensional health score summary.
   *
   * @since v1.0.0
   */
  calculate(
    governanceScore: number,
    driftScore: number,
    techDebtScore: number
  ): IntelligenceHealthSummary {
    const rawScore = (governanceScore * 0.4) + (driftScore * 0.3) + (techDebtScore * 0.3);
    const score = Math.round(Math.max(0, Math.min(100, rawScore)));

    const status = score >= 80 ? "healthy" : score >= 65 ? "warning" : "error";

    return {
      score,
      governanceScore,
      driftScore,
      techDebtScore,
      status,
      timestamp: new Date().toISOString()
    };
  }
}
