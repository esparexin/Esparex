import type { BrainSnapshot } from "@esparex/repository-brain";
import {
  PluginRegistry,
  Analyzer,
  AnalyzerContext,
  GovernanceAnalyzer,
  AnalysisResultEnvelope,
  ValidationReport,
  GovernanceSummaryReport,
  BenchmarkResult,
  BenchmarkProfile
} from "../types/index.js";
import { calculateOverallScore } from "../scoring/index.js";
import { AstCache } from "./cache.js";
import { BenchmarkHarness } from "./benchmark.js";

export interface EngineRunOptions {
  /**
   * Compiled BrainSnapshot — the canonical input for all Phase 4+ analyzers.
   * All governance analyzers that implement GovernanceAnalyzer will receive this.
   */
  snapshot: BrainSnapshot;

  registry: PluginRegistry;
  profile: string;
  config: Record<string, any>;

  /**
   * @deprecated Since Phase 4. Provided only as a fallback for legacy Analyzer
   * implementations that have not yet migrated to GovernanceAnalyzer.
   * Will be removed in the Phase 5 milestone.
   */
  workspaceRoot?: string;

  /** PR7B: Enable in-memory AST cache (default: true) */
  cache?: boolean;

  /** PR7B: Enable benchmark mode */
  benchmark?: BenchmarkProfile;
}

export interface EngineRunResult {
  report: GovernanceSummaryReport;
  exitCode: number;
  performanceMeta?: Record<string, any>;
}

// Type guard: distinguishes legacy Analyzer (has .metadata.id) from GovernanceAnalyzer (has .id)
function isLegacyAnalyzer(a: Analyzer | GovernanceAnalyzer): a is Analyzer {
  return "metadata" in a && typeof (a as any).metadata?.id === "string";
}

function getAnalyzerId(a: Analyzer | GovernanceAnalyzer): string {
  return isLegacyAnalyzer(a) ? a.metadata.id : a.id;
}

function getAnalyzerDeps(a: Analyzer | GovernanceAnalyzer): string[] {
  return isLegacyAnalyzer(a) ? (a.metadata.dependsOn || []) : [];
}

export class GovernanceEngine {
  static resolveDependencies(analyzers: (Analyzer | GovernanceAnalyzer)[]): (Analyzer | GovernanceAnalyzer)[] {
    const resolved: (Analyzer | GovernanceAnalyzer)[] = [];
    const visited  = new Set<string>();
    const visiting = new Set<string>();

    const map = new Map<string, Analyzer | GovernanceAnalyzer>();
    for (const a of analyzers) map.set(getAnalyzerId(a), a);

    function visit(id: string) {
      if (visited.has(id)) return;
      if (visiting.has(id)) throw new Error(`Circular dependency detected involving analyzer: ${id}`);
      visiting.add(id);
      const analyzer = map.get(id);
      if (analyzer) {
        for (const dep of getAnalyzerDeps(analyzer)) visit(dep);
        resolved.push(analyzer);
      }
      visiting.delete(id);
      visited.add(id);
    }

    for (const a of analyzers) visit(getAnalyzerId(a));
    return resolved;
  }

  static async run(options: EngineRunOptions): Promise<EngineRunResult> {
    const { snapshot, registry, profile, config } = options;

    // PR7B: Initialize shared AST cache (per-invocation, no cross-run persistence)
    const cacheEnabled = options.cache !== false;
    const astCache = cacheEnabled ? new AstCache() : null;

    // Legacy context for backward-compatible Analyzer implementations.
    // @deprecated — will be removed in Phase 5.
    const legacyContext: AnalyzerContext = {
      workspaceRoot: options.workspaceRoot ?? snapshot.repository.root,
      config,
      git: {
        currentBranch: snapshot.repository.branch,
        isClean: true
      }
    };

    // Profile filtering
    let activeAnalyzers: (Analyzer | GovernanceAnalyzer)[] = registry.analyzers;
    if (profile === "quick") {
      activeAnalyzers = registry.analyzers.filter(a =>
        getAnalyzerId(a) === "git" || getAnalyzerId(a) === "env"
      );
    } else if (profile === "doctor") {
      activeAnalyzers = registry.analyzers.filter(a =>
        getAnalyzerId(a) === "env" || getAnalyzerId(a) === "git"
      );
    } else if (profile === "ci") {
      activeAnalyzers = registry.analyzers.filter(a => {
        const id = getAnalyzerId(a);
        return id === "unicode-hygiene" || id === "git" || id === "architecture";
      });
    }

    const executionOrder = this.resolveDependencies(activeAnalyzers);
    const envelopes: AnalysisResultEnvelope[] = [];

    // PR7B: Run benchmark if enabled (before main execution, non-destructive)
    let benchmarkResults: BenchmarkResult[] | undefined;
    if (options.benchmark?.enabled) {
      const harness = new BenchmarkHarness();
      benchmarkResults = await harness.runAll(
        executionOrder,
        snapshot,
        options.benchmark.iterations || 3
      );
    }

    // ── Run analyzers ──────────────────────────────────────────────────────
    for (const analyzer of executionOrder) {
      const id = "metadata" in analyzer ? analyzer.metadata.id : analyzer.id;
      try {
        let envelope: AnalysisResultEnvelope;
        if ("analyze" in analyzer) {
          // GovernanceAnalyzer (Phase 4+) — receives snapshot only
          envelope = await (analyzer as GovernanceAnalyzer).analyze(snapshot);
        } else {
          // Legacy Analyzer — receives deprecated AnalyzerContext
          envelope = await (analyzer as Analyzer).run(legacyContext);
        }
        envelopes.push(envelope);
      } catch (err: any) {
        envelopes.push({
          schemaVersion: "1.0.0",
          analyzerId: id,
          timestamp: new Date().toISOString(),
          status: "failure",
          durationMs: 0,
          warningsCount: 0,
          errorsCount: 1,
          metadata: { error: err.message },
          payload: null
        });
      }
    }

    // ── Run validators ─────────────────────────────────────────────────────
    const validationReports: {
      analyzerId: string;
      name: string;
      score: number;
      violationsCount: number;
      passed: boolean;
      report: ValidationReport;
    }[] = [];

    for (const envelope of envelopes) {
      const validator = registry.validators.find(
        v => v.id === `${envelope.analyzerId}-validator` || v.id === envelope.analyzerId
      );
      const analyzerEntry = executionOrder.find(
        a => getAnalyzerId(a) === envelope.analyzerId
      );
      const analyzerName = analyzerEntry
        ? (isLegacyAnalyzer(analyzerEntry) ? analyzerEntry.metadata.name : analyzerEntry.id)
        : envelope.analyzerId;

      if (validator) {
        try {
          const rules = config.rules?.[envelope.analyzerId] || {};
          const report = await validator.validate(envelope, rules);
          validationReports.push({ analyzerId: envelope.analyzerId, name: analyzerName, score: report.score, violationsCount: report.violations.length, passed: report.passed, report });
        } catch (err: any) {
          validationReports.push({
            analyzerId: envelope.analyzerId,
            name: analyzerName,
            score: 0,
            violationsCount: 1,
            passed: false,
            report: {
              schemaVersion: "1.0.0",
              analyzerId: envelope.analyzerId,
              score: 0,
              violations: [{ ruleId: "validator-failure", severity: "critical", message: `Validator failed: ${err.message}` }],
              passed: false
            }
          });
        }
      } else {
        validationReports.push({
          analyzerId: envelope.analyzerId,
          name: analyzerName,
          score: 100,
          violationsCount: 0,
          passed: true,
          report: { schemaVersion: "1.0.0", analyzerId: envelope.analyzerId, score: 100, violations: [], passed: true }
        });
      }
    }

    // ── Score and exit code ────────────────────────────────────────────────
    const overallScore = calculateOverallScore(validationReports);
    let exitCode = 0;
    let hasWarnings = false, hasErrors = false, hasCriticals = false;

    for (const vr of validationReports) {
      for (const v of vr.report.violations) {
        if (v.severity === "critical") hasCriticals = true;
        else if (v.severity === "error") hasErrors = true;
        else if (v.severity === "warning") hasWarnings = true;
      }
    }

    if (hasCriticals) exitCode = 3;
    else if (hasErrors) exitCode = 2;
    else if (hasWarnings) exitCode = 1;

    // PR7B: Attach performance metadata to report
    const performanceMeta: Record<string, any> = {};
    if (astCache) {
      performanceMeta.cacheStats = astCache.stats;
      // Clear cache for next invocation
      astCache.clear();
    }
    if (benchmarkResults) {
      performanceMeta.benchmark = benchmarkResults.map(r => ({
        analyzerId: r.analyzerId,
        averageDurationMs: parseFloat(r.averageDurationMs.toFixed(2)),
        averageMemoryMb: parseFloat(r.averageMemoryMb.toFixed(2)),
        minDurationMs: parseFloat(r.minDurationMs.toFixed(2)),
        maxDurationMs: parseFloat(r.maxDurationMs.toFixed(2))
      }));
    }

    return {
      report: {
        schemaVersion: "1.0.0",
        timestamp: new Date().toISOString(),
        overallScore,
        results: validationReports
      },
      exitCode,
      performanceMeta
    };
  }
}
