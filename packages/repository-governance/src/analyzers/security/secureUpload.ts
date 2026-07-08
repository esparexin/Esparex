import * as fs from "fs";
import * as path from "path";
import type { BrainSnapshot } from "@esparex/repository-brain";
import { GovernanceAnalyzer, AnalysisResultEnvelope, ViolationSeverity } from "../../types/index.js";

export interface SecureUploadViolation {
  file: string;
  route: string;
  severity: ViolationSeverity;
  message: string;
}

export class SecureUploadAnalyzer implements GovernanceAnalyzer<SecureUploadViolation[]> {
  id = "secure-upload";
  category = "security" as const;

  async analyze(snapshot: BrainSnapshot): Promise<AnalysisResultEnvelope<SecureUploadViolation[]>> {
    const violations: SecureUploadViolation[] = [];
    const workspaceRoot = snapshot.repository.root;
    const files = snapshot.repository.files || [];

    // Scan API route files for file upload middleware (multer, formidable)
    const routeFiles = files.filter(f =>
      /\/routes\//.test(f) && /\.(ts|js)$/.test(f) && !/\.(test|spec)\./.test(f)
    );

    for (const file of routeFiles) {
      let content: string;
      try {
        content = fs.readFileSync(path.join(workspaceRoot, file), "utf-8");
      } catch {
        continue;
      }
      const hasUploadMiddleware = /multer|formidable|upload\.single|upload\.array|upload\.fields|upload\.any/.test(content);
      const handlesMultipart = /multipart\/form-data|Content-Type:\s*multipart/.test(content);

      if (handlesMultipart && !hasUploadMiddleware) {
        violations.push({
          file,
          route: file,
          severity: "warning",
          message: `Route ${file} accepts multipart/form-data but no file upload middleware detected. Consider adding multer/formidable.`
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
