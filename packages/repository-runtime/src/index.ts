// ─── @esparex/repository-runtime — Public SDK API (v1.0) ───────────────────
//
// This is the official public boundary for the entire Esparex AI platform.
// External consumers must import ONLY from this module.
//
// All lower-level scan, parse, compile, validation, and execution packages
// are implementation details kept internal to the runtime.
//
// @since v1.0.0
// ─────────────────────────────────────────────────────────────────────────────

// Core SDK Entry Point
export { RepositoryRuntime } from "./sdk/runtime-sdk.js";
export type { RepositoryRuntimeStartOptions } from "./sdk/runtime-sdk.js";

// AI Assistant interface
export { RepositoryAssistant } from "./ai/assistant.js";
export type { AssistantResponse } from "./ai/assistant.js";

// Explainability Payload DTO
export type { ExplanationPayload } from "./explainability/engine.js";

// Event Bus hook payloads (read-only interfaces)
export { EventBus } from "./events/event-bus.js";
export type {
  DriftFinding,
  DriftReport,
  SnapshotCreatedEvent,
  SnapshotUpdatedEvent,
  DriftDetectedEvent,
  GovernanceCompletedEvent,
  SkillRecommendedEvent,
  RuntimeEventMap,
  RuntimeEventName,
  RuntimeEventPayload,
  RuntimeEventHandler
} from "./events/event-types.js";

// Dashboard DTO models
export type {
  HealthSummary,
  RepositoryStatistics,
  RecentDrift,
  RecentValidation,
  DashboardSummary
} from "./dashboard/models.js";

// Intelligence DTO models
export type {
  Recommendation,
  TechnicalDebtSummary,
  TrendSummary,
  RepositoryMemorySummary,
  RepositoryInsights
} from "@esparex/repository-intelligence";

// Versioning descriptors
export type { PluginWrapper } from "./plugins/registry.js";

export type {
  RepositoryPlugin,
  PluginManifest,
  PluginStatus,
  RepositoryRuntimeApi
} from "@esparex/repository-plugin-sdk";

// Versioning descriptors
export interface VersionDescriptor {
  readonly version: string;
  readonly since: string;
  readonly deprecated?: boolean;
  readonly replacement?: string;
  readonly plannedRemovalVersion?: string;
}
