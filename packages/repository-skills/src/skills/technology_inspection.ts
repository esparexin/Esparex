import { Skill, SkillContext, SkillInput, SkillResult, SkillMetadata } from "../types.js";

export interface TechnologyInspectionInput extends SkillInput {
  /** Optional: if provided, returns only the version of this framework. */
  framework?: string;
}

/**
 * TechnologyInspectionSkill
 *
 * Surfaces technology versions and stack information from the BrainSnapshot.
 *
 * Pattern demonstrated:
 *   snapshot.technology.express  → "^5.2.1"
 *   snapshot.technology.next     → "^16.0.6"
 *
 * Instead of:
 *   JSON.parse(fs.readFileSync("package.json")).dependencies["express"]
 *
 * The scanner has already parsed package.json and the Brain has modeled
 * the technology stack. This skill is a pure reader of that model —
 * no filesystem access required.
 */
export class TechnologyInspectionSkill implements Skill {
  readonly metadata: SkillMetadata = {
    id: "technology-inspection",
    name: "Technology Inspection Skill",
    version: "1.0.0",
    category: "inspection",
    description: "Returns technology versions and stack details from BrainSnapshot without reading package.json.",
    supportedFrameworks: ["express", "next", "react", "mongoose", "redis", "bullmq"]
  };

  async execute(context: SkillContext, input: SkillInput): Promise<SkillResult> {
    const start = Date.now();
    const { snapshot, logger } = context;
    const { framework } = input as TechnologyInspectionInput;

    const tech = snapshot.technology;

    if (framework) {
      // Single framework lookup
      const version = (tech as Record<string, string>)[framework];
      if (!version) {
        logger.warn(`TechnologyInspectionSkill: framework "${framework}" not found in snapshot.technology.`);
        return {
          skillId: this.metadata.id,
          status: "failure",
          durationMs: Date.now() - start,
          output: null,
          error: `Framework "${framework}" is not tracked in the BrainSnapshot technology model.`
        };
      }
      logger.info(`TechnologyInspectionSkill: ${framework} → ${version}`);
      return {
        skillId: this.metadata.id,
        status: "success",
        durationMs: Date.now() - start,
        output: { framework, version }
      };
    }

    // Full technology stack
    logger.info("TechnologyInspectionSkill: returning full technology stack from snapshot.");
    return {
      skillId: this.metadata.id,
      status: "success",
      durationMs: Date.now() - start,
      output: {
        repositoryName: snapshot.identity.name,
        packageManager: snapshot.identity.packageManager,
        workspaceType: snapshot.identity.workspaceType,
        technology: { ...tech }
      }
    };
  }
}
