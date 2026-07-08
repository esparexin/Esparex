import { BrainSnapshot } from "@esparex/repository-brain";
import { Skill, SkillCategory, SkillContext, SkillInput, SkillResult } from "../types.js";
import { SkillRegistry } from "../registry/skill-registry.js";

// ─── CapabilityRouter ──────────────────────────────────────────────────────
// Translates a capability request (task description + optional target path)
// into one or more skills, executes them, and returns a structured result.
//
// Why a router instead of manual skill selection?
//   Users and AI agents express outcomes ("scaffold a new controller"), not
//   skill identifiers. The router derives which skills to run from the
//   BrainSnapshot's architecture ownership map — no hardcoded folder names.
//
// Resolution strategy:
//   1. targetPath → resolved via snapshot.architecture.ownership → layer name
//      → skills registered for that layer's category.
//   2. categories  → direct category filter on the registry.
//   3. skillIds    → explicit selection (bypasses routing logic).
//   4. fallback    → all skills in the registry.
//
// The router never knows about "apps/web" or "backend/user" directly.
// That knowledge lives in architecture.json and is surfaced via BrainSnapshot.

export interface CapabilityRequest {
  /** Free-form description of the task (used for logging). */
  readonly task: string;
  /** Optional file or directory path to route against architecture ownership. */
  readonly targetPath?: string;
  /** Explicit category filter — bypasses path-based routing. */
  readonly categories?: SkillCategory[];
  /** Explicit skill ids — bypasses routing entirely. */
  readonly skillIds?: string[];
  /** Skill-specific inputs keyed by skill id. */
  readonly inputs?: Record<string, SkillInput>;
}

export interface CapabilityRouteResult {
  readonly task: string;
  readonly resolvedLayer?: string;
  readonly skillsExecuted: string[];
  readonly results: SkillResult[];
  readonly overallStatus: "success" | "partial" | "failure" | "skipped";
  readonly durationMs: number;
}

export class CapabilityRouter {
  constructor(
    private readonly registry: SkillRegistry
  ) {}

  /**
   * Route and execute a capability request.
   *
   * All repository path knowledge comes from the BrainSnapshot — the router
   * never references workspace paths directly.
   */
  async route(
    request: CapabilityRequest,
    context: SkillContext
  ): Promise<CapabilityRouteResult> {
    const start = Date.now();
    const snapshot = context.snapshot;

    // ── Step 1: Resolve skills ─────────────────────────────────────────
    let skills: Skill[] = [];
    let resolvedLayer: string | undefined;

    if (request.skillIds && request.skillIds.length > 0) {
      // Explicit skill selection — bypass routing
      skills = request.skillIds
        .map(id => this.registry.get(id))
        .filter((s): s is Skill => s !== undefined);
    } else if (request.categories && request.categories.length > 0) {
      // Category-based selection
      skills = request.categories.flatMap(cat => this.registry.listByCategory(cat));
    } else if (request.targetPath) {
      // Path-based routing via BrainSnapshot ownership map
      // The router NEVER hardcodes paths like "apps/web" or "backend/user".
      resolvedLayer = this.resolveLayerFromPath(request.targetPath, snapshot);
      if (resolvedLayer) {
        // Map layer name to a skill category
        const category = layerToCategory(resolvedLayer);
        if (category) {
          skills = this.registry.listByCategory(category);
        }
      }
      // Fallback: if no layer-matched skills, try inspection skills
      if (skills.length === 0) {
        skills = this.registry.listByCategory("inspection");
      }
    } else {
      // No routing hint — run all registered skills
      skills = this.registry.list();
    }

    if (skills.length === 0) {
      return {
        task: request.task,
        resolvedLayer,
        skillsExecuted: [],
        results: [],
        overallStatus: "skipped",
        durationMs: Date.now() - start
      };
    }

    // ── Step 2: Execute matched skills ────────────────────────────────
    const results: SkillResult[] = [];
    for (const skill of skills) {
      const input = request.inputs?.[skill.metadata.id] ?? {};
      const result = await this.registry.execute(skill.metadata.id, context, input);
      results.push(result);
    }

    // ── Step 3: Compute overall status ────────────────────────────────
    const overallStatus = computeStatus(results);

    return {
      task: request.task,
      resolvedLayer,
      skillsExecuted: skills.map(s => s.metadata.id),
      results,
      overallStatus,
      durationMs: Date.now() - start
    };
  }

  /**
   * Resolve the architecture layer for a given file path using the
   * BrainSnapshot ownership map — never hardcoded folder names.
   */
  private resolveLayerFromPath(targetPath: string, snapshot: BrainSnapshot): string | undefined {
    const normalized = targetPath.replace(/\\/g, "/");
    for (const [prefix, layerName] of Object.entries(snapshot.architecture.ownership)) {
      if (normalized.startsWith(prefix)) return layerName;
    }
    return undefined;
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Maps a Brain architecture layer name to a Skill category.
 * This mapping is the only place where layer names are associated with
 * execution categories — future layers simply add an entry here.
 */
function layerToCategory(layerName: string): SkillCategory | undefined {
  const map: Record<string, SkillCategory> = {
    "Presentation Layer":  "scaffolding",
    "Web Application":     "scaffolding",
    "Admin Application":   "scaffolding",
    "Transport Layer":     "code-generation",
    "Business Domain":     "code-generation",
    "Shared Library":      "code-generation",
    "Governance Platform": "repository-maintenance"
  };
  return map[layerName];
}

function computeStatus(results: SkillResult[]): CapabilityRouteResult["overallStatus"] {
  if (results.length === 0) return "skipped";
  const failures = results.filter(r => r.status === "failure").length;
  if (failures === 0) return "success";
  if (failures === results.length) return "failure";
  return "partial";
}
