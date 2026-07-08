import * as fs from "fs";
import * as path from "path";
import type { BrainSnapshot } from "@esparex/repository-brain";
import { GovernanceAnalyzer, AnalysisResultEnvelope, ViolationSeverity } from "../../types/index.js";

export interface DTOGovernanceViolation {
  file: string;
  severity: ViolationSeverity;
  message: string;
}

export class DTOGovernanceAnalyzer implements GovernanceAnalyzer<DTOGovernanceViolation[]> {
  id = "dto-governance";
  category = "architecture" as const;

  async analyze(snapshot: BrainSnapshot): Promise<AnalysisResultEnvelope<DTOGovernanceViolation[]>> {
    const violations: DTOGovernanceViolation[] = [];
    const workspaceRoot = snapshot.repository.root;

    const controllerFiles = (snapshot.repository.files || []).filter(f =>
      /\/controllers\//.test(f) && /\.(ts|js)$/.test(f) && !/\.(test|spec)\./.test(f)
    );

    for (const file of controllerFiles) {
      let content: string;
      try {
        content = fs.readFileSync(path.join(workspaceRoot, file), "utf-8");
      } catch {
        continue;
      }

      // Check for direct Axios imports in controllers (should go through service layer)
      const hasDirectAxios = /import\s+axios\s+from\s+["']axios["']/.test(content);
      const hasDirectFetch = /\bfetch\s*\(/.test(content) && !/\/\/.*fetch/.test(content);

      if (hasDirectAxios) {
        violations.push({
          file,
          severity: "error",
          message: `Direct axios import in controller ${file}. HTTP calls should be delegated to service layer.`
        });
      }

      if (hasDirectFetch) {
        violations.push({
          file,
          severity: "error",
          message: `Direct fetch() call in controller ${file}. HTTP calls should be delegated to service layer.`
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
      warningsCount: 0,
      errorsCount: violations.length,
      metadata: {},
      payload: violations
    };
  }
}
