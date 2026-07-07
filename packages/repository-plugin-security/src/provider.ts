/**
 * @since v1.0.0
 */
export interface VulnerabilityAdvisory {
  readonly packageName: string;
  readonly vulnerableRange: string;
  readonly severity: "info" | "warning" | "error";
  readonly reason: string;
}

/**
 * @since v1.0.0
 */
export interface VulnerabilityProvider {
  getAdvisories(): Promise<readonly VulnerabilityAdvisory[]>;
}
