import { execSync } from "child_process";
import { Analyzer, AnalyzerContext, AnalysisResultEnvelope } from "../types/index.js";

export interface GitStatusPayload {
  currentBranch: string;
  isClean: boolean;
  uncommittedFiles: string[];
}

export class GitAnalyzer implements Analyzer<GitStatusPayload> {
  metadata = {
    id: "git",
    name: "Git Repository Analyzer",
    category: "git" as const,
    version: "1.0.0",
    dependsOn: []
  };

  async run(context: AnalyzerContext): Promise<AnalysisResultEnvelope<GitStatusPayload>> {
    const startTime = Date.now();
    let currentBranch = "unknown";
    let isClean = true;
    const uncommittedFiles: string[] = [];

    try {
      // 1. Get branch
      try {
        currentBranch = execSync("git branch --show-current", { cwd: context.workspaceRoot, encoding: "utf8" }).trim();
      } catch {
        try {
          currentBranch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: context.workspaceRoot, encoding: "utf8" }).trim();
        } catch {
          currentBranch = "detached/unknown";
        }
      }

      // 2. Check clean status
      const statusOutput = execSync("git status --porcelain", { cwd: context.workspaceRoot, encoding: "utf8" });
      const lines = statusOutput.split("\n").map(l => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        isClean = false;
        uncommittedFiles.push(...lines);
      }

      // Pre-fill context git details
      context.git.currentBranch = currentBranch;
      context.git.isClean = isClean;

      return {
        schemaVersion: "1.0.0",
        analyzerId: this.metadata.id,
        timestamp: new Date().toISOString(),
        status: "success",
        durationMs: Date.now() - startTime,
        warningsCount: isClean ? 0 : 1,
        errorsCount: 0,
        metadata: {},
        payload: {
          currentBranch,
          isClean,
          uncommittedFiles
        }
      };
    } catch (error: any) {
      return {
        schemaVersion: "1.0.0",
        analyzerId: this.metadata.id,
        timestamp: new Date().toISOString(),
        status: "failure",
        durationMs: Date.now() - startTime,
        warningsCount: 0,
        errorsCount: 1,
        metadata: { error: error.message },
        payload: {
          currentBranch: "unknown",
          isClean: false,
          uncommittedFiles: []
        }
      };
    }
  }
}
