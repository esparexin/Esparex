import type { BrainSnapshot } from "@esparex/repository-brain";
import { GovernanceAnalyzer, AnalysisResultEnvelope } from "../types/index.js";

export interface EnvStatusPayload {
  rootEnvExists: boolean;
  rootEnvExampleExists: boolean;
  appAdminEnvExists: boolean;
  appWebEnvExists: boolean;
}

export class EnvAnalyzer implements GovernanceAnalyzer<EnvStatusPayload> {
  readonly id = "env";
  readonly category = "security" as const;

  async analyze(snapshot: BrainSnapshot): Promise<AnalysisResultEnvelope<EnvStatusPayload>> {
    const startTime = Date.now();

    // File discovery comes from the snapshot — never from direct fs.existsSync().
    // The scanner has already walked the repository; we check membership only.
    const fileSet = new Set(
      snapshot.repository.files.map(f => f.replace(/\\/g, "/"))
    );

    const has = (rel: string) => fileSet.has(rel) || fileSet.has(rel.replace(/^\//, ""));

    const rootEnvExists        = has(".env");
    const rootEnvExampleExists = has(".env.example");
    const appAdminEnvExists    = has("apps/admin/.env");
    const appWebEnvExists      = has("apps/web/.env");

    let warningsCount = 0;
    if (!rootEnvExists)     warningsCount++;
    if (!appAdminEnvExists) warningsCount++;
    if (!appWebEnvExists)   warningsCount++;

    return {
      schemaVersion: "1.0.0",
      analyzerId: this.id,
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
