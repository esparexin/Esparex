import * as fs from "fs";
import * as path from "path";
import type { BrainSnapshot } from "@esparex/repository-brain";
import { GovernanceAnalyzer, AnalysisResultEnvelope, ViolationSeverity } from "../../types/index.js";

export interface AppRouterLayoutViolation {
  file: string;
  severity: ViolationSeverity;
  message: string;
}

export class AppRouterLayoutAnalyzer implements GovernanceAnalyzer<AppRouterLayoutViolation[]> {
  id = "app-router-layout";
  category = "architecture" as const;

  async analyze(snapshot: BrainSnapshot): Promise<AnalysisResultEnvelope<AppRouterLayoutViolation[]>> {
    const violations: AppRouterLayoutViolation[] = [];
    const workspaceRoot = snapshot.repository.root;

    // Find app router layout files
    const appDirFiles = (snapshot.repository.files || []).filter(f =>
      /\/app\//.test(f) && /layout\.(tsx|jsx)$/.test(f)
    );

    for (const file of appDirFiles) {
      let content: string;
      try {
        content = fs.readFileSync(path.join(workspaceRoot, file), "utf-8");
      } catch {
        continue;
      }

      // Check for excessive nesting depth via path segments
      const segments = file.replace(/\\/g, "/").split("/");
      const appSegment = segments.findIndex(s => s === "app");
      const depth = appSegment >= 0 ? segments.length - appSegment - 2 : segments.length; // -1 for 'app/', -1 for 'layout.tsx'

      if (depth > 3) {
        violations.push({
          file,
          severity: "warning",
          message: `App router layout nesting depth of ${depth} in ${file}. Consider flattening to ≤ 3 levels.`
        });
      }

      // Check that layout re-exports children properly
      const hasChildrenOutlet = /\{children\}/.test(content);
      if (!hasChildrenOutlet) {
        violations.push({
          file,
          severity: "info",
          message: `Layout ${file} may be missing {children} outlet. Layouts should render children.`
        });
      }
    }

    const startTime = Date.now();
    return {
      schemaVersion: "1.0.0",
      analyzerId: this.id,
      timestamp: new Date().toISOString(),
      status: "success",
      durationMs: Date.now() - startTime,
      warningsCount: violations.length,
      errorsCount: 0,
      metadata: {},
      payload: violations
    };
  }
}
