import * as fs from "fs";
import * as path from "path";
import { AnalysisResultEnvelope, FixCapability, FixPreview, FixResult } from "../types/index.js";

export class DeepImportFixCapability implements FixCapability {
  id = "deep-imports-fix";
  description = "Rewrite deep imports to barrel imports";

  async eligibilityCheck(envelope: AnalysisResultEnvelope): Promise<boolean> {
    return envelope.analyzerId === "architecture" &&
      envelope.payload?.deepImports?.passed === false &&
      Array.isArray(envelope.payload?.deepImports?.filesFound) &&
      envelope.payload.deepImports.filesFound.length > 0;
  }

  async dryRun(envelope: AnalysisResultEnvelope): Promise<FixPreview> {
    const changes: { file: string; original: string; proposed: string }[] = [];
    const filesFound = envelope.payload?.deepImports?.filesFound || [];

    // filesFound is an array of "file:path:import" strings from git grep
    for (const entry of filesFound) {
      // Format: "src/services/X.ts:@esparex/core/some/deep/path"
      const match = entry.match(/^([^:]+):(.+)$/);
      if (!match) continue;

      const [_, file, importStatement] = match;
      const absPath = path.resolve(file);
      if (!fs.existsSync(absPath)) continue;
      const content = fs.readFileSync(absPath, "utf-8");

      // Extract the deep path to replace
      const deepMatch = importStatement.match(/@esparex\/core\/(.+)/);
      if (!deepMatch) continue;

      const deepPath = deepMatch[1];
      const barrelPath = "@esparex/core";

      // Find the exact import line and create fix
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const importRegex = new RegExp(`['"]${escapeRegex(barrelPath)}/${escapeRegex(deepPath)}['"]`);
        if (importRegex.test(line)) {
          changes.push({
            file,
            original: line,
            proposed: line.replace(importRegex, `"${barrelPath}"`)
          });
        }
      }
    }

    return { changes };
  }

  async apply(envelope: AnalysisResultEnvelope): Promise<FixResult> {
    const preview = await this.dryRun(envelope);
    const fixId = `deep-imports-fix-${Date.now()}`;
    const errors: string[] = [];
    let changesApplied = 0;

    for (const change of preview.changes) {
      try {
        const absPath = path.resolve(change.file);
        const content = fs.readFileSync(absPath, "utf-8");
        const newContent = content.replace(change.original, change.proposed);
        fs.writeFileSync(absPath, newContent, "utf-8");
        changesApplied++;
      } catch (err: any) {
        errors.push(`Failed to fix ${change.file}: ${err.message}`);
      }
    }

    return { fixId, changesApplied, errors };
  }

  async rollback(fixId: string): Promise<void> {
    // Rollback is handled by AutoFixEngine with backup copies
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
