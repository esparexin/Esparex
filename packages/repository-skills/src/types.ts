import type { BrainSnapshot } from "@esparex/repository-brain";

// ─── Skill Category ────────────────────────────────────────────────────────
// Every skill declares a category so the CapabilityRouter can select skills
// by capability class rather than by id, enabling plug-in extensibility.
export type SkillCategory =
  | "scaffolding"
  | "migration"
  | "refactoring"
  | "code-generation"
  | "documentation"
  | "repository-maintenance"
  | "inspection";

// ─── SkillMetadata ─────────────────────────────────────────────────────────
// Exposed on every skill so the SkillRegistry and AI agents can discover
// compatible skills without running them. supportedFrameworks enables future
// auto-selection (e.g. "only run this skill when Next.js is in the snapshot").
export interface SkillMetadata {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly category: SkillCategory;
  readonly description: string;
  readonly supportedFrameworks?: readonly string[];
  readonly requiredCapabilities?: readonly string[];
}

// ─── SkillInput / SkillResult ──────────────────────────────────────────────
// Inputs and outputs are intentionally open (Record<string, unknown>) so each
// skill can define its own domain-specific shape without coupling the core
// types to any particular skill's requirements.
export type SkillInput = Record<string, unknown>;

export interface SkillResult {
  readonly skillId: string;
  readonly status: "success" | "failure" | "skipped";
  readonly durationMs: number;
  readonly output: unknown;
  readonly error?: string;
}

// ─── SkillLogger ───────────────────────────────────────────────────────────
// Minimal logger interface so skills can emit structured messages without
// depending on a specific logging library. Implementations can route to
// console, a file, or a remote sink without changing skill code.
export interface SkillLogger {
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
}

// ─── SkillContext ──────────────────────────────────────────────────────────
// The single container injected into every skill at execution time.
//
// Design intent:
//   - snapshot is the ONLY source of repository knowledge.
//   - No skill parameter may accept workspaceRoot, process.cwd(), or
//     any other ambient repository reference.
//   - dryRun = true means the skill must simulate but not write any files.
//
// This makes skills deterministic and testable: pass a different snapshot,
// get different execution — without touching any external state.
export interface SkillContext {
  readonly snapshot: BrainSnapshot;
  readonly logger: SkillLogger;
  readonly dryRun: boolean;
}

// ─── Skill ─────────────────────────────────────────────────────────────────
// The canonical execution contract for the Skills platform.
//
// Rules:
//   1. execute() must derive all repository knowledge from context.snapshot.
//   2. execute() must respect context.dryRun — no writes when true.
//   3. Skills may write files only to paths resolved from the snapshot.
//      They must never enumerate directories (that belongs to the Scanner).
export interface Skill {
  readonly metadata: SkillMetadata;
  execute(context: SkillContext, input: SkillInput): Promise<SkillResult>;
}
