import * as fs from "fs";
import * as path from "path";
import type { BrainSnapshot } from "@esparex/repository-brain";
import { GovernanceAnalyzer, AnalysisResultEnvelope, ViolationSeverity } from "../../types/index.js";

export interface FontLoadViolation {
  file: string;
  severity: ViolationSeverity;
  message: string;
}

export class FontLoadingAnalyzer implements GovernanceAnalyzer<FontLoadViolation[]> {
  id = "font-loading";
  category = "performance" as const;

  async analyze(snapshot: BrainSnapshot): Promise<AnalysisResultEnvelope<FontLoadViolation[]>> {
    const violations: FontLoadViolation[] = [];
    const workspaceRoot = snapshot.repository.root;

    const templateFiles = (snapshot.repository.files || []).filter(f =>
      /\.(tsx|jsx|html)$/.test(f) && !/\.(test|spec)\./.test(f) && !/node_modules/.test(f)
    );

    for (const file of templateFiles) {
      let content: string;
      try {
        content = fs.readFileSync(path.join(workspaceRoot, file), "utf-8");
      } catch {
        continue;
      }

      // Check for Google Fonts / external font links without next/font
      const hasGoogleFontLink = /fonts\.googleapis\.com/.test(content);
      const hasNextFont = /next\/font/.test(content) || /@next\/font/.test(content);
      const hasFontFace = /@font-face/.test(content);

      if (hasGoogleFontLink && !hasNextFont) {
        violations.push({
          file,
          severity: "warning",
          message: `External Google Fonts link in ${file}. Consider using next/font for optimized font loading.`
        });
      }

      if (hasFontFace && !hasNextFont) {
        violations.push({
          file,
          severity: "info",
          message: `Custom @font-face declaration in ${file}. Consider using next/font for optimized loading.`
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
      warningsCount: violations.filter(v => v.severity === "warning").length,
      errorsCount: 0,
      metadata: {},
      payload: violations
    };
  }
}
