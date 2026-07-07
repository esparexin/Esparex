import type { BrainSnapshot } from "@esparex/repository-brain";
import { DriftFinding } from "../../events/event_types.js";
import { DriftComparator } from "../registry.js";

/**
 * WorkspaceComparator
 *
 * Compares the list of monorepo workspaces between the previous (baseline)
 * and current (live) snapshots. Detects added, removed, or modified workspaces.
 */
export class WorkspaceComparator implements DriftComparator {
  readonly id = "workspace-comparator";

  async compare(previous: BrainSnapshot, current: BrainSnapshot): Promise<DriftFinding[]> {
    const findings: DriftFinding[] = [];

    const prevWorkspaces = new Map(previous.workspace.map(w => [w.name, w]));
    const currWorkspaces = new Map(current.workspace.map(w => [w.name, w]));

    // 1. Check for removed or modified workspaces
    for (const [name, prev] of prevWorkspaces.entries()) {
      const curr = currWorkspaces.get(name);
      if (!curr) {
        findings.push({
          id: `workspace-removed-${name}`,
          severity: "error",
          category: "workspace",
          message: `Workspace "${name}" was removed or renamed from package workspaces.`,
          recommendation: `Run "refresh" to rebuild snapshot, then audit dependencies in other workspaces.`,
          suggestedSkillId: "workspace-resolution",
          suggestedSkillInput: { name }
        });
      } else {
        if (prev.path !== curr.path || prev.type !== curr.type) {
          findings.push({
            id: `workspace-modified-${name}`,
            severity: "warning",
            category: "workspace",
            message: `Workspace "${name}" attributes changed: path "${prev.path}" -> "${curr.path}", type "${prev.type}" -> "${curr.type}".`,
            recommendation: `Ensure correct architectural layer assignments inside config/architecture.json.`,
            suggestedSkillId: "workspace-resolution",
            suggestedSkillInput: { name }
          });
        }
      }
    }

    // 2. Check for added workspaces
    for (const [name, curr] of currWorkspaces.entries()) {
      if (!prevWorkspaces.has(name)) {
        findings.push({
          id: `workspace-added-${name}`,
          severity: "warning",
          category: "workspace",
          message: `New workspace "${name}" detected at path "${curr.path}".`,
          recommendation: `Update config/architecture.json to register its layer and assign owners.`,
          suggestedSkillId: "workspace-resolution",
          suggestedSkillInput: { name }
        });
      }
    }

    return findings;
  }
}
