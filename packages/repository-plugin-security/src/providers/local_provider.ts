import { VulnerabilityProvider, VulnerabilityAdvisory } from "../provider.js";

/**
 * LocalVulnerabilityProvider (v1.0)
 *
 * Provides a static, local dictionary database of known vulnerabilities.
 *
 * @since v1.0.0
 */
export class LocalVulnerabilityProvider implements VulnerabilityProvider {
  private readonly advisories: readonly VulnerabilityAdvisory[] = [
    {
      packageName: "lodash",
      vulnerableRange: "<4.17.21",
      severity: "error",
      reason: "Prototype pollution vulnerability in deep merge functions."
    },
    {
      packageName: "express",
      vulnerableRange: "<4.19.2",
      severity: "warning",
      reason: "Open redirect and content-type bypass vulnerabilities in query parsing."
    }
  ];

  async getAdvisories(): Promise<readonly VulnerabilityAdvisory[]> {
    return this.advisories;
  }
}
