import type { BrainSnapshot } from "@esparex/repository-brain";
import { GovernanceAnalyzer, AnalysisResultEnvelope } from "../types/index.js";

export interface GitStatusPayload {
  currentBranch: string;
  commit: string;
  // NOTE: live dirty-state (uncommittedFiles) requires a Git command and is
  // therefore intentionally omitted from this analyzer. Drift detection of
  // working-tree state belongs to Phase 7 (Drift Detection Engine) once the
  // scanner gains an incremental/watch mode that surfaces dirty-file events.
}

export class GitAnalyzer implements GovernanceAnalyzer<GitStatusPayload> {
  readonly id = "git";
  readonly category = "git" as const;

  async analyze(snapshot: BrainSnapshot): Promise<AnalysisResultEnvelope<GitStatusPayload>> {
    const startTime = Date.now();

    // Git metadata is owned by RepositoryScanner and surfaced via BrainSnapshot.
    // No Git commands are executed inside Governance.
    const currentBranch = snapshot.repository.branch;
    const commit        = snapshot.repository.commit;

    return {
      schemaVersion: "1.0.0",
      analyzerId: this.id,
      timestamp: new Date().toISOString(),
      status: "success",
      durationMs: Date.now() - startTime,
      warningsCount: 0,
      errorsCount: 0,
      metadata: {},
      payload: { currentBranch, commit }
    };
  }
}
