import * as fs from "fs";
import * as path from "path";
import type { BrainSnapshot } from "@esparex/repository-brain";
import { GovernanceAnalyzer, AnalysisResultEnvelope, ViolationSeverity } from "../../types/index.js";

export interface RenderBlockViolation {
  file: string;
  severity: ViolationSeverity;
  message: string;
  line?: number;
}

export class RenderBlockingAnalyzer implements GovernanceAnalyzer<RenderBlockViolation[]> {
  id = "render-blocking";
  category = "performance" as const;

  async analyze(snapshot: BrainSnapshot): Promise<AnalysisResultEnvelope<RenderBlockViolation[]>> {
    const violations: RenderBlockViolation[] = [];
    const workspaceRoot = snapshot.repository.root;

    const htmlLikeFiles = (snapshot.repository.files || []).filter(f =>
      /\.(html|tsx|jsx)$/.test(f) && !/\.(test|spec)\./.test(f) && !/node_modules/.test(f)
    );

    for (const file of htmlLikeFiles) {
      let content: string;
      try {
        content = fs.readFileSync(path.join(workspaceRoot, file), "utf-8");
      } catch {
        continue;
      }

      const lines = content.split("\n");

      // Check for synchronous <script> tags without async/defer
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const scriptMatch = line.match(/<script[^>]*src=["']([^"']+)["'][^>]*>/);
        if (scriptMatch) {
          const hasAsync = /async/.test(line);
          const hasDefer = /defer/.test(line);
          if (!hasAsync && !hasDefer) {
            violations.push({
              file,
              severity: "warning",
              message: `Synchronous <script> tag found in ${file} (line ${i + 1}). Consider adding async or defer attribute.`,
              line: i + 1
            });
          }
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
      errorsCount: 0,
      metadata: {},
      payload: violations
    };
  }
}
