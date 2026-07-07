/**
 * @since v1.0.0
 */
export interface HealthSummary {
  readonly score: number; // Governance compliance score (0-100)
  readonly driftScore: number; // Repository drift score (0-100)
  readonly status: "healthy" | "warning" | "error";
  readonly timestamp: string;
  readonly governancePassed: boolean;
  readonly driftPassed: boolean;
}

/**
 * @since v1.0.0
 */
export interface RepositoryStatistics {
  readonly workspaceCount: number;
  readonly filesCount: number;
  readonly layersCount: number;
  readonly policiesCount: number;
  readonly dependenciesCount: number;
}

/**
 * @since v1.0.0
 */
export interface RecentDrift {
  readonly timestamp: string;
  readonly score: number;
  readonly findingsCount: number;
}

/**
 * @since v1.0.0
 */
export interface RecentValidation {
  readonly timestamp: string;
  readonly score: number;
  readonly passed: boolean;
}

/**
 * @since v1.0.0
 */
export interface DashboardSummary {
  readonly health: HealthSummary;
  readonly statistics: RepositoryStatistics;
  readonly recentDrifts: readonly RecentDrift[];
  readonly recentValidations: readonly RecentValidation[];
}
