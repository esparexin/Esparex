import * as fs from "fs";
import * as path from "path";
import { Analyzer, AnalyzerContext, AnalysisResultEnvelope } from "../types/index.js";

export interface EnvStatusPayload {
  rootEnvExists: boolean;
  rootEnvExampleExists: boolean;
  appAdminEnvExists: boolean;
  appWebEnvExists: boolean;
}

export class EnvAnalyzer implements Analyzer<EnvStatusPayload> {
  metadata = {
    id: "env",
    name: "Environment Sanity Analyzer",
    category: "security" as const,
    version: "1.0.0",
    dependsOn: []
  };

  async run(context: AnalyzerContext): Promise<AnalysisResultEnvelope<EnvStatusPayload>> {
    const startTime = Date.now();
    const root = context.workspaceRoot;

    const rootEnvExists = fs.existsSync(path.join(root, ".env"));
    const rootEnvExampleExists = fs.existsSync(path.join(root, ".env.example"));
    const appAdminEnvExists = fs.existsSync(path.join(root, "apps/admin/.env"));
    const appWebEnvExists = fs.existsSync(path.join(root, "apps/web/.env"));

    let warningsCount = 0;
    if (!rootEnvExists) warningsCount++;
    if (!appAdminEnvExists) warningsCount++;
    if (!appWebEnvExists) warningsCount++;

    return {
      schemaVersion: "1.0.0",
      analyzerId: this.metadata.id,
      timestamp: new Date().toISOString(),
      status: "success",
      durationMs: Date.now() - startTime,
      warningsCount,
      errorsCount: 0,
      metadata: {},
      payload: {
        rootEnvExists,
        rootEnvExampleExists,
        appAdminEnvExists,
        appWebEnvExists
      }
    };
  }
}
