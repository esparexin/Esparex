import type { BrainSnapshot } from "@esparex/repository-brain";
import { DriftFinding } from "../../events/event-types.js";
import { DriftComparator } from "../registry.js";

/**
 * PolicyComparator
 *
 * Compares the declarative architecture boundaries and coding policies
 * between the previous (baseline) and current (live) snapshots. Detects
 * changes to allowed/forbidden imports and policy definitions.
 */
export class PolicyComparator implements DriftComparator {
  readonly id = "policy-comparator";

  async compare(previous: BrainSnapshot, current: BrainSnapshot): Promise<DriftFinding[]> {
    const findings: DriftFinding[] = [];

    const prevBoundaries = previous.policies.boundaries;
    const currBoundaries = current.policies.boundaries;

    const allKeys = new Set([...Object.keys(prevBoundaries), ...Object.keys(currBoundaries)]);

    for (const key of allKeys) {
      const prev = prevBoundaries[key];
      const curr = currBoundaries[key];

      if (prev && !curr) {
        findings.push({
          id: `policy-boundary-removed-${key}`,
          severity: "error",
          category: "policy",
          message: `Architecture boundary policy for layer "${key}" was removed.`,
          recommendation: `Restore the boundary configuration in config/policies.json if this was unintentional.`,
          suggestedSkillId: "layer-resolution",
          suggestedSkillInput: { filePath: key }
        });
      } else if (!prev && curr) {
        findings.push({
          id: `policy-boundary-added-${key}`,
          severity: "warning",
          category: "policy",
          message: `New boundary policy declared for layer "${key}".`,
          recommendation: `Run governance validations to ensure current code complies with these new boundaries.`,
          suggestedSkillId: "layer-resolution",
          suggestedSkillInput: { filePath: key }
        });
      } else if (prev && curr) {
        // Compare allowed imports
        const prevAllowed = new Set(prev.allowed);
        const currAllowed = new Set(curr.allowed);
        const prevForbidden = new Set(prev.forbidden);
        const currForbidden = new Set(curr.forbidden);

        const allowedDiffers = prev.allowed.length !== curr.allowed.length || prev.allowed.some(x => !currAllowed.has(x));
        const forbiddenDiffers = prev.forbidden.length !== curr.forbidden.length || prev.forbidden.some(x => !currForbidden.has(x));

        if (allowedDiffers || forbiddenDiffers) {
          findings.push({
            id: `policy-boundary-changed-${key}`,
            severity: "warning",
            category: "policy",
            message: `Boundary rules for layer "${key}" have changed.`,
            recommendation: `Run governance validation to check for import violations against modified rules.`,
            suggestedSkillId: "layer-resolution",
            suggestedSkillInput: { filePath: key }
          });
        }
      }
    }

    return findings;
  }
}
