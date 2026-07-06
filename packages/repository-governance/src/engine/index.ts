import {
  PluginRegistry,
  Analyzer,
  AnalyzerContext,
  AnalysisResultEnvelope,
  ValidationReport,
  GovernanceSummaryReport
} from "../types/index.js";
import { calculateOverallScore } from "../scoring/index.js";

export interface EngineRunOptions {
  workspaceRoot: string;
  registry: PluginRegistry;
  profile: string;
  config: Record<string, any>;
}

export interface EngineRunResult {
  report: GovernanceSummaryReport;
  exitCode: number;
}

export class GovernanceEngine {
  static resolveDependencies(analyzers: Analyzer[]): Analyzer[] {
    const resolved: Analyzer[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const map = new Map<string, Analyzer>();
    for (const a of analyzers) {
      map.set(a.metadata.id, a);
    }

    function visit(id: string) {
      if (visited.has(id)) return;
      if (visiting.has(id)) {
        throw new Error(`Circular dependency detected involving analyzer: ${id}`);
      }
      visiting.add(id);

      const analyzer = map.get(id);
      if (analyzer) {
        const deps = analyzer.metadata.dependsOn || [];
        for (const dep of deps) {
          visit(dep);
        }
        resolved.push(analyzer);
      }

      visiting.delete(id);
      visited.add(id);
    }

    for (const a of analyzers) {
      visit(a.metadata.id);
    }

    return resolved;
  }

  static async run(options: EngineRunOptions): Promise<EngineRunResult> {
    const { workspaceRoot, registry, profile, config } = options;

    const context: AnalyzerContext = {
      workspaceRoot,
      config,
      git: {
        currentBranch: "unknown",
        isClean: true
      }
    };

    // Filter analyzers based on profile
    // Profile profiles maps:
    // 'quick' -> env, git
    // 'doctor' -> env, git, dependencies, ports
    // 'ci' -> unicode-hygiene, git
    // 'health' / 'full' -> all
    let activeAnalyzers = registry.analyzers;
    if (profile === "quick") {
      activeAnalyzers = registry.analyzers.filter(a => a.metadata.id === "git" || a.metadata.id === "env");
    } else if (profile === "doctor") {
      activeAnalyzers = registry.analyzers.filter(a => a.metadata.id === "env" || a.metadata.id === "git");
    } else if (profile === "ci") {
      activeAnalyzers = registry.analyzers.filter(a => a.metadata.id === "unicode-hygiene" || a.metadata.id === "git" || a.metadata.id === "architecture");
    }

    // Resolve dependencies ordering
    const executionOrder = this.resolveDependencies(activeAnalyzers);

    const envelopes: AnalysisResultEnvelope[] = [];
    const validationReports: {
      analyzerId: string;
      name: string;
      score: number;
      violationsCount: number;
      passed: boolean;
      report: ValidationReport;
    }[] = [];

    // 1. Run Analyzers
    for (const analyzer of executionOrder) {
      try {
        const envelope = await analyzer.run(context);
        envelopes.push(envelope);
      } catch (err: any) {
        envelopes.push({
          schemaVersion: "1.0.0",
          analyzerId: analyzer.metadata.id,
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

    // 2. Run Validators
    for (const envelope of envelopes) {
      // Find matching validator
      // Convention: validator id matches `${analyzerId}-validator` or just matches analyzerId
      const validator = registry.validators.find(v => v.id === `${envelope.analyzerId}-validator` || v.id === envelope.analyzerId);
      const analyzerMeta = executionOrder.find(a => a.metadata.id === envelope.analyzerId)?.metadata;
      const analyzerName = analyzerMeta?.name || envelope.analyzerId;

      if (validator) {
        try {
          const rules = config.rules?.[envelope.analyzerId] || {};
          const report = await validator.validate(envelope, rules);
          validationReports.push({
            analyzerId: envelope.analyzerId,
            name: analyzerName,
            score: report.score,
            violationsCount: report.violations.length,
            passed: report.passed,
            report
          });
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
              violations: [{
                ruleId: "validator-failure",
                severity: "critical",
                message: `Validator failed: ${err.message}`
              }],
              passed: false
            }
          });
        }
      } else {
        // Default pass validation if no validator registered
        validationReports.push({
          analyzerId: envelope.analyzerId,
          name: analyzerName,
          score: 100,
          violationsCount: 0,
          passed: true,
          report: {
            schemaVersion: "1.0.0",
            analyzerId: envelope.analyzerId,
            score: 100,
            violations: [],
            passed: true
          }
        });
      }
    }

    // 3. Compute Scores
    const overallScore = calculateOverallScore(validationReports);

    // Determine Exit Code:
    // 0: Success (all passed, no errors/criticals)
    // 1: Warnings present (score < 100 but passed)
    // 2: Standard validation failures (errors)
    // 3: Critical gate violations
    let exitCode = 0;
    let hasWarnings = false;
    let hasErrors = false;
    let hasCriticals = false;

    for (const vr of validationReports) {
      for (const violation of vr.report.violations) {
        if (violation.severity === "critical") hasCriticals = true;
        else if (violation.severity === "error") hasErrors = true;
        else if (violation.severity === "warning") hasWarnings = true;
      }
    }

    if (hasCriticals) exitCode = 3;
    else if (hasErrors) exitCode = 2;
    else if (hasWarnings) exitCode = 1;

    const report: GovernanceSummaryReport = {
      schemaVersion: "1.0.0",
      timestamp: new Date().toISOString(),
      overallScore,
      results: validationReports
    };

    return {
      report,
      exitCode
    };
  }
}
