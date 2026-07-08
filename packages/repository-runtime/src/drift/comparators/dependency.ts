import type { BrainSnapshot } from "@esparex/repository-brain";
import { DriftFinding } from "../../events/event-types.js";
import { DriftComparator } from "../registry.js";

/**
 * DependencyComparator
 *
 * Compares the technology version stack between the previous (baseline)
 * and current (live) snapshots. Detects version changes or missing packages.
 */
export class DependencyComparator implements DriftComparator {
  readonly id = "dependency-comparator";

  async compare(previous: BrainSnapshot, current: BrainSnapshot): Promise<DriftFinding[]> {
    const findings: DriftFinding[] = [];

    const prevTech = previous.technology as Record<string, string>;
    const currTech = current.technology as Record<string, string>;

    const allKeys = new Set([...Object.keys(prevTech), ...Object.keys(currTech)]);

    for (const key of allKeys) {
      const prevVer = prevTech[key];
      const currVer = currTech[key];

      if (prevVer && !currVer) {
        findings.push({
          id: `technology-removed-${key}`,
          severity: "warning",
          category: "dependency",
          message: `Technology package "${key}" was removed from the project stack.`,
          recommendation: `Verify that no remaining codebase scripts import or depend on "${key}".`,
          suggestedSkillId: "technology-inspection",
          suggestedSkillInput: { framework: key }
        });
      } else if (!prevVer && currVer) {
        findings.push({
          id: `technology-added-${key}`,
          severity: "info",
          category: "dependency",
          message: `New technology package "${key}" (${currVer}) added to the stack.`,
          recommendation: `Add technology conventions for "${key}" to the repository coding standards documentation.`,
          suggestedSkillId: "technology-inspection",
          suggestedSkillInput: { framework: key }
        });
      } else if (prevVer !== currVer) {
        findings.push({
          id: `technology-changed-${key}`,
          severity: "warning",
          category: "dependency",
          message: `Technology package "${key}" version changed: "${prevVer}" -> "${currVer}".`,
          recommendation: `Check for deprecations or breaking API changes introduced by upgrading "${key}".`,
          suggestedSkillId: "technology-inspection",
          suggestedSkillInput: { framework: key }
        });
      }
    }

    return findings;
  }
}
