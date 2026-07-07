import {
  RepositoryPlugin,
  RepositoryRuntimeApi,
  PluginManifest
} from "@esparex/repository-plugin-sdk";
import { VulnerabilityProvider } from "./provider.js";

/**
 * SecurityPlugin (v1.0)
 *
 * Scans repository technology dependencies against vulnerability advisories.
 *
 * @since v1.0.0
 */
export class SecurityPlugin implements RepositoryPlugin {
  readonly manifest: PluginManifest = {
    id: "repository-plugin-security",
    version: "1.0.0",
    displayName: "Security Audit Plugin",
    description: "Monitors workspace dependencies against known vulnerability advisory databases.",
    category: "security",
    runtime: {
      minimum: "1.0.0"
    },
    permissions: ["events", "governance"],
    capabilities: ["governance", "report"]
  };

  private runtime?: RepositoryRuntimeApi;
  private unsubscribeEvent?: () => void;

  constructor(
    private readonly provider: VulnerabilityProvider
  ) {}

  async initialize(runtime: RepositoryRuntimeApi): Promise<void> {
    this.runtime = runtime;
    
    // Subscribe to post-validation events to execute scans
    this.unsubscribeEvent = runtime.subscribe("validation.completed", async (payload: any) => {
      const issues = await this.audit();
      if (issues.length > 0) {
        console.warn(`[SecurityPlugin WARNING] Found ${issues.length} dependency vulnerabilities:`);
        for (const issue of issues) {
          console.warn(`  - [${issue.severity.toUpperCase()}] ${issue.packageName} (${issue.vulnerableRange}): ${issue.reason}`);
        }
      }
    });
  }

  async enable(): Promise<void> {
    // Activation logic
  }

  async disable(): Promise<void> {
    // Unsubscription is automatically cleaned up by registry, but good practice to clear local ref
  }

  async dispose(): Promise<void> {
    if (this.unsubscribeEvent) {
      this.unsubscribeEvent();
    }
  }

  /**
   * Scans dependencies in the baseline snapshot and compares versions.
   */
  async audit(): Promise<readonly any[]> {
    if (!this.runtime) return [];
    
    const snapshot = this.runtime.snapshot();
    if (!snapshot || !snapshot.technology) return [];

    const advisories = await this.provider.getAdvisories();
    const findings: any[] = [];

    // Loop through technology dependencies mapped in the snapshot
    for (const [techName, techVer] of Object.entries(snapshot.technology)) {
      // Find matching advisory
      const matched = advisories.filter(adv => adv.packageName === techName);
      for (const adv of matched) {
        // Evaluate if version is vulnerable (simple check for mock range: if version starts with a number below target)
        // e.g. if techVer is "^4.16.0" and range is "<4.19.2"
        const cleanVer = String(techVer).replace(/[\^~>=]/g, "");
        const limitVer = adv.vulnerableRange.replace(/[<>=]/g, "");
        
        if (this.isVulnerable(cleanVer, limitVer)) {
          findings.push({
            packageName: techName,
            vulnerableRange: adv.vulnerableRange,
            severity: adv.severity,
            reason: adv.reason
          });
        }
      }
    }

    return findings;
  }

  private isVulnerable(version: string, limit: string): boolean {
    const vParts = version.split(".").map(Number);
    const lParts = limit.split(".").map(Number);

    for (let i = 0; i < Math.max(vParts.length, lParts.length); i++) {
      const vVal = vParts[i] || 0;
      const lVal = lParts[i] || 0;
      if (vVal < lVal) return true;
      if (vVal > lVal) return false;
    }
    return false;
  }
}
