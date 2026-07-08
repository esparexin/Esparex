import * as fs from "fs";
import * as path from "path";
import type { BrainSnapshot } from "@esparex/repository-brain";
import { GovernanceAnalyzer, AnalysisResultEnvelope, ViolationSeverity } from "../../types/index.js";

export interface ObservabilityViolation {
  file: string;
  severity: ViolationSeverity;
  message: string;
  line?: number;
}

export class ObservabilityAnalyzer implements GovernanceAnalyzer<ObservabilityViolation[]> {
  id = "observability";
  category = "architecture" as const;

  async analyze(snapshot: BrainSnapshot): Promise<AnalysisResultEnvelope<ObservabilityViolation[]>> {
    const violations: ObservabilityViolation[] = [];
    const workspaceRoot = snapshot.repository.root;

    const sourceFiles = (snapshot.repository.files || []).filter(f =>
      /\.(ts|js)$/.test(f) && !/\.(test|spec)\./.test(f) && !/node_modules/.test(f) &&
      !/dist\//.test(f)
    );

    for (const file of sourceFiles) {
      let content: string;
      try {
        content = fs.readFileSync(path.join(workspaceRoot, file), "utf-8");
      } catch {
        continue;
      }

      const lines = content.split("\n");

      // Check for console.log in non-test files
      if (!/\.(test|spec)\./.test(file)) {
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // Match console.log but not console.error/warn/info which are often legitimate
          if (/console\.(log)\s*\(/.test(line) && !/\/\/\s*eslint-disable/.test(line)) {
            violations.push({
              file,
              severity: "warning",
              message: `Raw console.log() in ${file} (line ${i + 1}). Consider using a structured logger instead.`,
              line: i + 1
            });
          }
        }
      }

      // Check for bare Axios imports in controller/service files
      if (/\/controllers\//.test(file) || /\/services\//.test(file)) {
        const hasBareAxios = /import\s+axios\s+from\s+["']axios["']/.test(content);
        if (hasBareAxios) {
          violations.push({
            file,
            severity: "warning",
            message: `Direct axios import in ${file}. Use the shared HTTP client wrapper instead.`
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
      warningsCount: violations.length,
      errorsCount: 0,
      metadata: {},
      payload: violations
    };
  }
}
