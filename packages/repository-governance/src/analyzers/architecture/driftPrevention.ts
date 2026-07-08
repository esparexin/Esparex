import * as fs from "fs";
import * as path from "path";
import type { BrainSnapshot } from "@esparex/repository-brain";
import { GovernanceAnalyzer, AnalysisResultEnvelope, ViolationSeverity } from "../../types/index.js";

export interface DriftPreventionViolation {
  file: string;
  severity: ViolationSeverity;
  message: string;
}

export class DriftPreventionAnalyzer implements GovernanceAnalyzer<DriftPreventionViolation[]> {
  id = "drift-prevention";
  category = "architecture" as const;

  async analyze(snapshot: BrainSnapshot): Promise<AnalysisResultEnvelope<DriftPreventionViolation[]>> {
    const violations: DriftPreventionViolation[] = [];
    const workspaceRoot = snapshot.repository.root;

    // Find shared Zod schema files and their usage
    const sharedSchemaFiles = (snapshot.repository.files || []).filter(f =>
      /shared\/src\/.*\.(ts|js)$/.test(f) && /schema|validation|types/.test(f)
    );

    const sourceFiles = (snapshot.repository.files || []).filter(f =>
      /\.(ts|js)$/.test(f) && !/\.(test|spec)\./.test(f) && !/shared\/src\//.test(f) &&
      !/node_modules/.test(f)
    );

    // Check if shared schemas are imported where they should be
    const sharedSchemaNames: string[] = [];
    for (const file of sharedSchemaFiles) {
      let content: string;
      try {
        content = fs.readFileSync(path.join(workspaceRoot, file), "utf-8");
      } catch {
        continue;
      }
      // Extract exported Zod schemas
      const exports = content.match(/export\s+(const|function)\s+(\w+Schema\w*)/g);
      if (exports) {
        for (const exp of exports) {
          const match = exp.match(/(\w+Schema\w*)/);
          if (match) sharedSchemaNames.push(match[1]);
        }
      }
    }

    if (sharedSchemaNames.length === 0) return {
      schemaVersion: "1.0.0",
      analyzerId: this.id,
      timestamp: new Date().toISOString(),
      status: "success",
      durationMs: 0,
      warningsCount: 0,
      errorsCount: 0,
      metadata: {},
      payload: violations
    };

    // Check that source files that should use shared schemas actually do
    for (const file of sourceFiles) {
      let content: string;
      try {
        content = fs.readFileSync(path.join(workspaceRoot, file), "utf-8");
      } catch {
        continue;
      }

      // Check for inline Zod schema definitions that duplicate shared ones
      const hasInlineZod = /z\.object\s*\(\{/.test(content);

      // Check if the file imports from shared schemas
      const importsShared = sharedSchemaNames.some(name =>
        new RegExp(`import\\s+.*${name}.*from`).test(content)
      );

      if (hasInlineZod && !importsShared && !/\/shared\//.test(file)) {
        // Check if this file is likely a duplicate of a shared schema
        const usesRouter = /router|route|api/.test(file);
        const usesTypes = /interface|type\s+\w/.test(content);

        if (usesRouter || usesTypes) {
          violations.push({
            file,
            severity: "info",
            message: `Inline Zod schema in ${file}. Consider importing shared schemas to prevent drift.`
          });
        }
      }
    }

    const startTime = Date.now();
    return {
      schemaVersion: "1.0.0",
      analyzerId: this.id,
      timestamp: new Date().toISOString(),
      status: "success",
      durationMs: Date.now() - startTime,
      warningsCount: violations.filter(v => v.severity === "warning").length,
      errorsCount: violations.filter(v => v.severity === "error").length,
      metadata: {},
      payload: violations
    };
  }
}
