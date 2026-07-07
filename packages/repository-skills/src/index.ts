// ─── @esparex/repository-skills — Public API ──────────────────────────────
//
// This is the only file consumers should import from.
// Internal modules (registry/, router/, skills/) are implementation details.
//
// Usage:
//   import { SkillRegistry, CapabilityRouter, DefaultSkillRegistry } from "@esparex/repository-skills";
//
// ─────────────────────────────────────────────────────────────────────────────

// Core types
export type {
  Skill,
  SkillMetadata,
  SkillCategory,
  SkillInput,
  SkillResult,
  SkillContext,
  SkillLogger
} from "./types.js";

// Registry
export { SkillRegistry } from "./registry/skill_registry.js";

// Router
export { CapabilityRouter } from "./router/capability_router.js";
export type { CapabilityRequest, CapabilityRouteResult } from "./router/capability_router.js";

// Reference skills
export { WorkspaceResolutionSkill } from "./skills/workspace_resolution.js";
export { LayerResolutionSkill } from "./skills/layer_resolution.js";
export { TechnologyInspectionSkill } from "./skills/technology_inspection.js";
export { ScaffoldingSkill } from "./skills/scaffolding.js";

// ─── DefaultSkillRegistry ─────────────────────────────────────────────────
// Pre-loaded registry with all four reference skills.
// Consumers can use this directly or construct their own registry and
// register additional plugin skills as needed.
import { SkillRegistry } from "./registry/skill_registry.js";
import { WorkspaceResolutionSkill } from "./skills/workspace_resolution.js";
import { LayerResolutionSkill } from "./skills/layer_resolution.js";
import { TechnologyInspectionSkill } from "./skills/technology_inspection.js";
import { ScaffoldingSkill } from "./skills/scaffolding.js";

export const DefaultSkillRegistry = new SkillRegistry()
  .register(new WorkspaceResolutionSkill())
  .register(new LayerResolutionSkill())
  .register(new TechnologyInspectionSkill())
  .register(new ScaffoldingSkill());
