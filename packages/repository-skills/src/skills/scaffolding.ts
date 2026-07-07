// ─── File-Writing Exception ────────────────────────────────────────────────
//
// This is the ONLY skill in @esparex/repository-skills that writes to the
// filesystem.
//
// Permitted:  fs.writeFile(resolvedAbsolutePath, content)  ← output writing
// Forbidden:  fs.readdir / fs.existsSync / glob / walk     ← discovery
//
// Rationale: Scaffolding is execution — generating new files is the purpose
// of this skill. The TARGET PATH is always resolved from BrainSnapshot (via
// snapshot.workspace or snapshot.repository.root) — the skill never
// derives paths from process.cwd() or hardcoded folder names.
//
// Architecture Contract Reference: Phase 5 — Skills write using snapshot paths
// ─────────────────────────────────────────────────────────────────────────────

import * as fs from "fs/promises";
import * as path from "path";
import { Skill, SkillContext, SkillInput, SkillResult, SkillMetadata } from "../types.js";

export interface ScaffoldingInput extends SkillInput {
  /** Workspace name — resolved via snapshot.workspace, not hardcoded path. */
  workspaceName: string;
  /** Relative file name within the workspace (e.g. "src/components/Button.tsx"). */
  fileName: string;
  /** File content template to write. */
  template: string;
}

/**
 * ScaffoldingSkill
 *
 * Generates a new file inside a workspace whose path is resolved from the
 * BrainSnapshot — not from hardcoded folder names.
 *
 * Pattern demonstrated:
 *   snapshot.workspace("web").path  → "apps/web"
 *   → write to: <repo-root>/apps/web/src/components/Button.tsx
 *
 * Instead of:
 *   fs.writeFile("apps/web/src/components/Button.tsx", ...)   ← hardcoded
 *
 * If the workspace is renamed or moved, only architecture.json and the
 * workspace list change — this skill does not change.
 */
export class ScaffoldingSkill implements Skill {
  readonly metadata: SkillMetadata = {
    id: "scaffolding",
    name: "File Scaffolding Skill",
    version: "1.0.0",
    category: "scaffolding",
    description: "Generates a new file in a snapshot-resolved workspace path. Respects dryRun mode."
  };

  async execute(context: SkillContext, input: SkillInput): Promise<SkillResult> {
    const start = Date.now();
    const { snapshot, logger, dryRun } = context;
    const { workspaceName, fileName, template } = input as ScaffoldingInput;

    if (!workspaceName || !fileName || template === undefined) {
      return { skillId: this.metadata.id, status: "failure", durationMs: Date.now() - start, output: null, error: "Inputs 'workspaceName', 'fileName', and 'template' are required." };
    }

    // ── Resolve workspace path from snapshot — never hardcoded ────────
    const workspace = snapshot.workspace.find(
      w => w.name === workspaceName
        || w.path === `apps/${workspaceName}`
        || w.path === `backend/${workspaceName}`
        || w.path === `packages/${workspaceName}`
        || w.path === workspaceName
    );

    if (!workspace) {
      return { skillId: this.metadata.id, status: "failure", durationMs: Date.now() - start, output: null, error: `Workspace "${workspaceName}" not found in BrainSnapshot.` };
    }

    // ── Build absolute output path from snapshot.repository.root ──────
    // snapshot.repository.root is the canonical repository root —
    // not process.cwd(), not a hardcoded path.
    const absoluteDir  = path.join(snapshot.repository.root, workspace.path, path.dirname(fileName));
    const absoluteFile = path.join(snapshot.repository.root, workspace.path, fileName);
    const relativeFile = path.join(workspace.path, fileName).replace(/\\/g, "/");

    logger.info(`ScaffoldingSkill: target → "${relativeFile}"`, { dryRun });

    if (dryRun) {
      // Dry run: simulate but do not write.
      logger.info(`ScaffoldingSkill: [dry-run] would write ${template.length} bytes to "${relativeFile}".`);
      return {
        skillId: this.metadata.id,
        status: "success",
        durationMs: Date.now() - start,
        output: { dryRun: true, resolvedPath: relativeFile, absolutePath: absoluteFile, bytesWouldWrite: template.length }
      };
    }

    // ── Write — permitted exception (see header comment) ──────────────
    try {
      await fs.mkdir(absoluteDir, { recursive: true });
      await fs.writeFile(absoluteFile, template, "utf8");
      logger.info(`ScaffoldingSkill: wrote ${template.length} bytes to "${relativeFile}".`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { skillId: this.metadata.id, status: "failure", durationMs: Date.now() - start, output: null, error: `Write failed: ${message}` };
    }

    return {
      skillId: this.metadata.id,
      status: "success",
      durationMs: Date.now() - start,
      output: {
        dryRun: false,
        resolvedPath: relativeFile,
        absolutePath: absoluteFile,
        bytesWritten: template.length
      }
    };
  }
}
