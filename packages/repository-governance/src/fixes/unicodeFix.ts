import * as fs from "fs";
import * as path from "path";
import { AnalysisResultEnvelope, FixCapability, FixPreview, FixResult } from "../types/index.js";

export class UnicodeFixCapability implements FixCapability {
  id = "unicode-hygiene-fix";
  description = "Replace invisible Unicode characters (BOM, ZWSP) with explicit alternatives";

  async eligibilityCheck(envelope: AnalysisResultEnvelope): Promise<boolean> {
    return envelope.analyzerId === "unicode-hygiene" &&
      Array.isArray(envelope.payload) &&
      envelope.payload.length > 0;
  }

  async dryRun(envelope: AnalysisResultEnvelope): Promise<FixPreview> {
    const payload = envelope.payload as any[];
    const changes: { file: string; original: string; proposed: string }[] = [];

    for (const v of payload) {
      const absPath = path.resolve(v.file);
      if (!fs.existsSync(absPath)) continue;
      const content = fs.readFileSync(absPath, "utf-8");

      // Replace ZWSP (U+200B) with explicit comment
      const zeroWidthSpace = "\u200B";
      const lines = content.split("\n");
      const lineIndex = (v.line || 1) - 1;
      if (lines[lineIndex]?.includes(zeroWidthSpace)) {
        const original = lines[lineIndex];
        const proposed = original.replace(zeroWidthSpace, "/* ZWSP */");
        if (original !== proposed) {
          changes.push({ file: v.file, original, proposed });
        }
      }
    }

    return { changes };
  }

  async apply(envelope: AnalysisResultEnvelope): Promise<FixResult> {
    const preview = await this.dryRun(envelope);
    const fixId = `unicode-fix-${Date.now()}`;
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
