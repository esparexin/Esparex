import { Skill, SkillContext, SkillInput, SkillResult, SkillMetadata } from "../types.js";

export interface LayerResolutionInput extends SkillInput {
  filePath: string;
}

/**
 * LayerResolutionSkill
 *
 * Given a file path, resolves the architecture layer it belongs to and
 * returns the layer's import boundaries from the snapshot's policy model.
 *
 * Pattern demonstrated:
 *   snapshot.architecture.ownership["backend/user"] → "Transport Layer"
 *   snapshot.policies.boundaries["Transport"]       → { allowed, forbidden }
 *
 * Instead of:
 *   if (path.startsWith("backend/user")) { ... }   ← hardcoded
 *
 * If the repository is restructured, architecture.json changes — this skill
 * does not change.
 */
export class LayerResolutionSkill implements Skill {
  readonly metadata: SkillMetadata = {
    id: "layer-resolution",
    name: "Layer Resolution Skill",
    version: "1.0.0",
    category: "inspection",
    description: "Resolves the architecture layer for a file path and returns its policy boundaries from BrainSnapshot."
  };

  async execute(context: SkillContext, input: SkillInput): Promise<SkillResult> {
    const start = Date.now();
    const { snapshot, logger } = context;
    const { filePath } = input as LayerResolutionInput;

    if (!filePath) {
      return { skillId: this.metadata.id, status: "failure", durationMs: Date.now() - start, output: null, error: "Input 'filePath' is required." };
    }

    const normalized = filePath.replace(/\\/g, "/");

    // Layer resolution via snapshot ownership map — no hardcoded paths.
    let resolvedLayer: string | undefined;
    let resolvedPrefix: string | undefined;
    for (const [prefix, layerName] of Object.entries(snapshot.architecture.ownership)) {
      if (normalized.startsWith(prefix)) {
        resolvedLayer = layerName;
        resolvedPrefix = prefix;
        break;
      }
    }

    if (!resolvedLayer) {
      logger.warn(`LayerResolutionSkill: no layer found for path "${filePath}".`);
      return { skillId: this.metadata.id, status: "failure", durationMs: Date.now() - start, output: null, error: `No architecture layer matches path "${filePath}".` };
    }

    // Policy boundaries from snapshot — no separate config file reads.
    // Boundary keys in policies.json match layer names; we try the layer name
    // and also a normalized version (remove " Layer" suffix for lookups).
    const boundaryKey = Object.keys(snapshot.policies.boundaries).find(
      k => resolvedLayer?.includes(k) || resolvedLayer === k
    );
    const boundaries = boundaryKey ? snapshot.policies.boundaries[boundaryKey] : undefined;

    logger.info(`LayerResolutionSkill: "${filePath}" → "${resolvedLayer}" (prefix: "${resolvedPrefix}")`);

    return {
      skillId: this.metadata.id,
      status: "success",
      durationMs: Date.now() - start,
      output: {
        filePath: normalized,
        layer: resolvedLayer,
        pathPrefix: resolvedPrefix,
        boundaries: boundaries ?? { allowed: [], forbidden: [] }
      }
    };
  }
}
