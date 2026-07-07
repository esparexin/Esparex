import type { BrainSnapshot } from "@esparex/repository-brain";
import type { GovernanceSummaryReport } from "@esparex/repository-governance";

export interface DriftFinding {
  readonly id: string;
  readonly severity: "info" | "warning" | "error";
  readonly category: "workspace" | "dependency" | "policy" | "filesystem";
  readonly message: string;
  readonly affectedLayer?: string;
  readonly recommendation?: string;
  readonly suggestedSkillId?: string;
  readonly suggestedSkillInput?: Record<string, unknown>;
}

export interface DriftReport {
  readonly status: "clean" | "warning" | "error";
  readonly findings: readonly DriftFinding[];
  readonly score: number; // 100 - (findings penalties)
  readonly requiresSnapshotRefresh: boolean;
  readonly timestamp: string;
}

export interface SnapshotCreatedEvent {
  readonly snapshot: BrainSnapshot;
}

export interface SnapshotUpdatedEvent {
  readonly previous: BrainSnapshot;
  readonly current: BrainSnapshot;
}

export interface DriftDetectedEvent {
  readonly report: DriftReport;
}

export interface GovernanceCompletedEvent {
  readonly report: GovernanceSummaryReport;
  readonly exitCode: number;
}

export interface SkillRecommendedEvent {
  readonly skillId: string;
  readonly reason: string;
  readonly input: Record<string, unknown>;
}

export type RuntimeEventMap = {
  "snapshot.created": SnapshotCreatedEvent;
  "snapshot.updated": SnapshotUpdatedEvent;
  "drift.detected": DriftDetectedEvent;
  "governance.completed": GovernanceCompletedEvent;
  "skill.recommended": SkillRecommendedEvent;
};

export type RuntimeEventName = keyof RuntimeEventMap;
export type RuntimeEventPayload<T extends RuntimeEventName> = RuntimeEventMap[T];
export type RuntimeEventHandler<T extends RuntimeEventName> = (payload: RuntimeEventPayload<T>) => void | Promise<void>;
