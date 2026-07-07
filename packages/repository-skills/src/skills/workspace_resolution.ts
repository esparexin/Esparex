import { Skill, SkillContext, SkillInput, SkillResult, SkillMetadata } from "../types.js";

export interface WorkspaceResolutionInput extends SkillInput {
  name: string;
}

/**
 * WorkspaceResolutionSkill
 *
 * Resolves the canonical path and metadata for a workspace by name,
 * sourcing the answer entirely from BrainSnapshot.workspace.
 *
 * Pattern demonstrated:
 *   snapshot.workspace("web") → { path: "apps/web", type: "Presentation", ... }
 *
 * Instead of:
 *   path.join(workspaceRoot, "apps/web")   ← hardcoded
 *
 * This makes workspace resolution portable: different repositories supply
 * different snapshots; the skill code never changes.
 */
export class WorkspaceResolutionSkill implements Skill {
  readonly metadata: SkillMetadata = {
    id: "workspace-resolution",
    name: "Workspace Resolution Skill",
    version: "1.0.0",
    category: "inspection",
    description: "Resolves workspace path and metadata from BrainSnapshot without hardcoded paths."
  };

  async execute(context: SkillContext, input: SkillInput): Promise<SkillResult> {
    const start = Date.now();
    const { snapshot, logger } = context;
    const { name } = input as WorkspaceResolutionInput;

    if (!name) {
      return { skillId: this.metadata.id, status: "failure", durationMs: Date.now() - start, output: null, error: "Input 'name' is required." };
    }

    // All path knowledge comes from the snapshot — no hardcoded paths.
    const workspace = snapshot.workspace.find(
      w => w.name === name
        || w.path === `apps/${name}`
        || w.path === `backend/${name}`
        || w.path === `packages/${name}`
        || w.path === name
    );

    if (!workspace) {
      logger.warn(`WorkspaceResolutionSkill: no workspace found for name "${name}".`);
      return { skillId: this.metadata.id, status: "failure", durationMs: Date.now() - start, output: null, error: `Workspace "${name}" not found in BrainSnapshot.` };
    }

    logger.info(`WorkspaceResolutionSkill: resolved "${name}" → "${workspace.path}" (${workspace.type})`);

    return {
      skillId: this.metadata.id,
      status: "success",
      durationMs: Date.now() - start,
      output: {
        name: workspace.name,
        path: workspace.path,
        absolutePath: `${snapshot.repository.root}/${workspace.path}`,
        type: workspace.type,
        version: workspace.version
      }
    };
  }
}
