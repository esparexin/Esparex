import { Skill, SkillCategory, SkillContext, SkillInput, SkillResult } from "../types.js";

// ─── SkillRegistry ─────────────────────────────────────────────────────────
// Plugin-based registry for all registered Skills.
//
// Why a registry instead of a hardcoded list?
//   Without a registry, every new skill requires modifying the CapabilityRouter
//   or a central if/else chain. With a registry, new skills are registered as
//   plugins — the router discovers them dynamically.
//
// Usage:
//   const registry = new SkillRegistry();
//   registry.register(new WorkspaceResolutionSkill());
//   registry.register(new ScaffoldingSkill());
//   const result = await registry.execute("workspace-resolution", context, input);
export class SkillRegistry {
  private readonly skills = new Map<string, Skill>();

  /** Register a skill plugin. Throws if a skill with the same id is already registered. */
  register(skill: Skill): this {
    if (this.skills.has(skill.metadata.id)) {
      throw new Error(
        `SkillRegistry: skill "${skill.metadata.id}" is already registered. ` +
        `Use a unique id or deregister the existing skill first.`
      );
    }
    this.skills.set(skill.metadata.id, skill);
    return this;
  }

  /** Deregister a skill by id (useful for testing or runtime reconfiguration). */
  deregister(id: string): boolean {
    return this.skills.delete(id);
  }

  /** Retrieve a skill by id. Returns undefined if not found. */
  get(id: string): Skill | undefined {
    return this.skills.get(id);
  }

  /** List all registered skills. */
  list(): Skill[] {
    return Array.from(this.skills.values());
  }

  /** List skills filtered by category. Enables the CapabilityRouter to discover by capability class. */
  listByCategory(category: SkillCategory): Skill[] {
    return this.list().filter(s => s.metadata.category === category);
  }

  /** List skills that support a given framework (from their metadata.supportedFrameworks). */
  listByFramework(framework: string): Skill[] {
    return this.list().filter(
      s => s.metadata.supportedFrameworks?.includes(framework) ?? false
    );
  }

  /**
   * Execute a skill by id.
   * Wraps execution with timing and error capture so callers always receive
   * a structured SkillResult — never an unhandled exception.
   */
  async execute(id: string, context: SkillContext, input: SkillInput): Promise<SkillResult> {
    const skill = this.skills.get(id);
    if (!skill) {
      return {
        skillId: id,
        status: "failure",
        durationMs: 0,
        output: null,
        error: `SkillRegistry: skill "${id}" is not registered.`
      };
    }

    const start = Date.now();
    try {
      const result = await skill.execute(context, input);
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        skillId: id,
        status: "failure",
        durationMs: Date.now() - start,
        output: null,
        error: message
      };
    }
  }
}
