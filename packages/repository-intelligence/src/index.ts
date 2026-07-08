// ─── @esparex/repository-intelligence — Public API (v1.0) ───────────────────
//
// The official reasoning and analysis package of the Esparex AI platform.
// Exposes data models and engines to calculate scores, technical debt,
// trends, and recommendations.
//
// @since v1.0.0
// ─────────────────────────────────────────────────────────────────────────────

// Core Types
export type {
  Recommendation,
  TechnicalDebtSummary,
  IntelligenceHealthSummary,
  TrendSummary,
  RepositoryMemorySummary,
  RepositoryInsights
} from "./types/index.js";

// Engines
export { RecommendationEngine } from "./recommendation/engine.js";
export { RepositoryHealthEngine } from "./health/engine.js";
export { TechnicalDebtEngine } from "./debt/engine.js";
export { TrendEngine } from "./trends/engine.js";
export { RepositoryMemory } from "./memory/repo-memory.js";
