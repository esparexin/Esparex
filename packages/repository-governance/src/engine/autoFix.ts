import * as fs from "fs";
import * as path from "path";
import {
  AnalysisResultEnvelope,
  FixCapability,
  FixPreview,
  FixResult,
  FixCapability as FixCapabilityInterface
} from "../types/index.js";

export class AutoFixEngine {
  private fixHistory: Map<string, { backupDir: string }> = new Map();

  async eligibleChecks(
    envelope: AnalysisResultEnvelope,
    fixCapabilities: FixCapabilityInterface[]
  ): Promise<FixCapabilityInterface[]> {
    const eligible: FixCapabilityInterface[] = [];
    for (const fix of fixCapabilities) {
      try {
        const isEligible = await fix.eligibilityCheck(envelope);
        if (isEligible) eligible.push(fix);
      } catch {
        // If eligibility check fails, skip
      }
    }
    return eligible;
  }

  async dryRun(
    envelope: AnalysisResultEnvelope,
    fix: FixCapabilityInterface
  ): Promise<FixPreview> {
    return fix.dryRun(envelope);
  }

  async apply(
    envelope: AnalysisResultEnvelope,
    fix: FixCapabilityInterface,
    workspaceRoot: string
  ): Promise<FixResult> {
    // Run dry-run first to get preview
    const preview = await fix.dryRun(envelope);

    // Create backup
    const fixId = `fix-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const backupDir = path.join(workspaceRoot, ".governance-fix-backups", fixId);
    fs.mkdirSync(backupDir, { recursive: true });

    // Backup original files
    for (const change of preview.changes) {
      const fullPath = path.join(workspaceRoot, change.file);
      const backupPath = path.join(backupDir, change.file.replace(/[/\\]/g, "_"));
      if (fs.existsSync(fullPath)) {
        fs.copyFileSync(fullPath, backupPath);
      }
    }

    this.fixHistory.set(fixId, { backupDir });

    // Apply fixes
    const errors: string[] = [];
    let changesApplied = 0;

    for (const change of preview.changes) {
      try {
        const fullPath = path.join(workspaceRoot, change.file);
        const existingContent = fs.readFileSync(fullPath, "utf-8");
        const newContent = existingContent.replace(change.original, change.proposed);
        fs.writeFileSync(fullPath, newContent, "utf-8");
        changesApplied++;
      } catch (err: any) {
        errors.push(`Failed to fix ${change.file}: ${err.message}`);
      }
    }

    return { fixId, changesApplied, errors };
  }

  async rollback(fixId: string, workspaceRoot: string): Promise<boolean> {
    const entry = this.fixHistory.get(fixId);
    if (!entry) return false;

    const backupDir = entry.backupDir;
    if (!fs.existsSync(backupDir)) return false;

    const backupFiles = fs.readdirSync(backupDir);
    for (const backupFile of backupFiles) {
      // Reconstruct original file path from backup filename
      const originalPath = backupFile.replace(/_/g, path.sep);
      const fullPath = path.join(workspaceRoot, originalPath);
      const backupPath = path.join(backupDir, backupFile);
      if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, fullPath);
      }
    }

    // Clean up backup directory
    fs.rmSync(backupDir, { recursive: true, force: true });
    this.fixHistory.delete(fixId);
    return true;
  }
}
