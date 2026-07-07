import type { BrainSnapshot } from "@esparex/repository-brain";

export interface PluginRegistry {
  analyzers: (Analyzer | GovernanceAnalyzer)[];
  validators: Validator[];
  reporters: Reporter[];
}

export interface AnalyzerMetadata {
  id: string;
  name: string;
  category: "architecture" | "git" | "code-quality" | "security" | "performance" | "documentation" | "testing";
  version: string;
  timeoutMs?: number;
  tags?: string[];
  dependsOn?: string[]; // IDs of analyzers that must run before this one
}

/**
 * @deprecated Since Phase 4. Use GovernanceAnalyzer.analyze(snapshot) instead.
 * AnalyzerContext will be removed in the Phase 5 milestone once all analyzers
 * have migrated to the GovernanceAnalyzer interface.
 */
export interface AnalyzerContext {
  workspaceRoot: string;
  config: Record<string, any>;
  git: {
    currentBranch: string;
    isClean: boolean;
  };
}

/**
 * Canonical interface for all Governance analyzers (Phase 4+).
 *
 * Analyzers must:
 *   - Receive a BrainSnapshot as their only input.
 *   - Never read `fs`, `path`, or execute Git commands directly.
 *   - Never import @esparex/repository-scanner directly.
 *
 * Exception: Analyzers that check file *contents* (e.g. UnicodeHygieneAnalyzer)
 * may call `fs.readFileSync` on paths sourced from `snapshot.repository.files`,
 * but must not perform file *discovery* themselves.
 */
export interface GovernanceAnalyzer<T = unknown> {
  readonly id: string;
  readonly category: "architecture" | "git" | "code-quality" | "security" | "performance" | "documentation" | "testing";
  analyze(snapshot: BrainSnapshot): Promise<AnalysisResultEnvelope<T>>;
}

export interface AnalysisResultEnvelope<T = any> {
  schemaVersion: "1.0.0";
  analyzerId: string;
  timestamp: string;
  status: "success" | "failure" | "timeout" | "skipped";
  durationMs: number;
  warningsCount: number;
  errorsCount: number;
  metadata: Record<string, any>;
  payload: T; // Inner data payload
}

export interface Analyzer<T = any> {
  metadata: AnalyzerMetadata;
  run(context: AnalyzerContext): Promise<AnalysisResultEnvelope<T>>;
}

export type ViolationSeverity = "info" | "warning" | "error" | "critical";

export interface RuleViolation {
  ruleId: string;
  severity: ViolationSeverity;
  message: string;
  file?: string;
  line?: number;
  col?: number;
  metadata?: Record<string, any>;
}

export interface ValidationReport {
  schemaVersion: "1.0.0";
  analyzerId: string;
  score: number; // 0 to 100
  violations: RuleViolation[];
  passed: boolean;
}

export interface Validator<T = any> {
  id: string;
  name: string;
  validate(envelope: AnalysisResultEnvelope<T>, rulesConfig: Record<string, any>): Promise<ValidationReport>;
}

export interface GovernanceSummaryReport {
  schemaVersion: "1.0.0";
  timestamp: string;
  overallScore: number;
  results: {
    analyzerId: string;
    name: string;
    score: number;
    violationsCount: number;
    passed: boolean;
    report: ValidationReport;
  }[];
}

export interface Reporter {
  id: string;
  name: string;
  write(report: GovernanceSummaryReport, options: Record<string, any>): Promise<void>;
}

export interface Checker<TPayload = any> {
  id: string;
  name: string;
  check(context: AnalyzerContext): Promise<TPayload>;
}

export interface ArchitectureAnalysisPayload {
  deepImports: { passed: boolean; filesFound: string[] };
  circular: { passed: boolean; cycles: string[][] };
  boundaryCore: { passed: boolean; errorOutput?: string };
  boundaryBackend: { passed: boolean; errorOutput?: string };
  publicApi: { passed: boolean; outputLog?: string };
}
