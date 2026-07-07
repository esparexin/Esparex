import type { BrainSnapshot } from "@esparex/repository-brain";

/**
 * @since v1.0.0
 */
export interface Recommendation {
  readonly id: string;
  readonly title: string;
  readonly category: "architecture" | "dependency" | "code-quality" | "governance";
  readonly severity: "info" | "warning" | "error";
  readonly priority: "low" | "medium" | "high" | "critical";
  readonly confidence: number; // 0.0 to 1.0 confidence ratio
  readonly reason: string;
  readonly evidence: string;
  readonly recommendation: string;
  readonly suggestedSkill?: string;
  readonly estimatedEffortMin: number;
  readonly estimatedImpact: "low" | "medium" | "high";
}

/**
 * @since v1.0.0
 */
export interface TechnicalDebtSummary {
  readonly score: number; // 100 - penalties
  readonly duplicateCodeBlocksCount: number;
  readonly staleDependencies: readonly string[];
  readonly orphanFiles: readonly string[];
  readonly deprecatedApiCount: number;
}

/**
 * @since v1.0.0
 */
export interface IntelligenceHealthSummary {
  readonly score: number; // Overward health calculated from multiple dimensions
  readonly governanceScore: number;
  readonly driftScore: number;
  readonly techDebtScore: number;
  readonly status: "healthy" | "warning" | "error";
  readonly timestamp: string;
}

/**
 * @since v1.0.0
 */
export interface TrendSummary {
  readonly scoreTrend: "improving" | "stable" | "declining";
  readonly scoreChange: number;
  readonly recurringViolations: readonly string[];
  readonly recurringDrifts: readonly string[];
  readonly stabilityRatio: number; // Stability index from 0.0 to 1.0
}

/**
 * @since v1.0.0
 */
export interface RepositoryMemorySummary {
  readonly recurringViolationsCount: Record<string, number>;
  readonly recurringDriftsCount: Record<string, number>;
  readonly historicalScores: readonly number[];
  readonly lastAnalyzedCommit?: string;
}

/**
 * @since v1.0.0
 */
export interface RepositoryInsights {
  readonly health: IntelligenceHealthSummary;
  readonly technicalDebt: TechnicalDebtSummary;
  readonly trends: TrendSummary;
  readonly recommendations: readonly Recommendation[];
}
