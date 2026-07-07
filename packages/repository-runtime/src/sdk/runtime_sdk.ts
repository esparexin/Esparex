import { RepositoryScanner, RepositoryInventory } from "@esparex/repository-scanner";
import { BrainFactory, BrainSnapshot, WorkspaceMetadata } from "@esparex/repository-brain";
import { GovernanceEngine, GovernanceSummaryReport } from "@esparex/repository-governance";
import { DefaultSkillRegistry, SkillResult, CapabilityRouteResult, CapabilityRequest } from "@esparex/repository-skills";

import { EventBus } from "../events/event_bus.js";
import { DriftReport, DriftFinding } from "../events/event_types.js";
import { RuntimeContext, RuntimeLogger } from "../context/runtime_context.js";
import { RepositoryRuntime as Engine } from "../orchestrator/runtime.js";
import { ExplanationPayload, ExplainabilityEngine } from "../explainability/engine.js";
import { HealthSummary } from "../dashboard/models.js";
import { HealthHistoryEntry } from "../history/history_manager.js";

import {
  RecommendationEngine,
  RepositoryHealthEngine,
  TechnicalDebtEngine,
  TrendEngine,
  RepositoryMemory,
  Recommendation,
  RepositoryInsights,
  TrendSummary,
  RepositoryMemorySummary
} from "@esparex/repository-intelligence";

import { RepositoryPlugin } from "@esparex/repository-plugin-sdk";
import { ExtensionRegistry, PluginWrapper } from "../plugins/registry.js";

/**
 * @since v1.0.0
 */
export interface RepositoryRuntimeStartOptions {
  readonly workspaceRoot?: string;
  readonly plugins?: readonly RepositoryPlugin[];
  readonly logger?: RuntimeLogger;
}

// Default CLI/SDK silent logger
const silentLogger: RuntimeLogger = {
  info: () => {},
  warn: () => {},
  error: () => {}
};

/**
 * RepositoryRuntime SDK Facade (v1.0)
 *
 * The official unified boundary for the entire Esparex AI platform.
 * External consumers must import ONLY this class or its adjacent DTO types.
 *
 * @since v1.0.0
 */
export class RepositoryRuntime {
  private readonly engine: Engine;
  private readonly context: RuntimeContext;
  private readonly explainabilityEngine: ExplainabilityEngine;
  private readonly recommendationEngine: RecommendationEngine;
  private readonly healthEngine: RepositoryHealthEngine;
  private readonly debtEngine: TechnicalDebtEngine;
  private readonly trendEngine: TrendEngine;
  private readonly memoryEngine: RepositoryMemory;
  private readonly extensionRegistry: ExtensionRegistry;

  private constructor(context: RuntimeContext, engine: Engine) {
    this.context = context;
    this.engine = engine;
    this.explainabilityEngine = new ExplainabilityEngine();
    this.recommendationEngine = new RecommendationEngine();
    this.healthEngine = new RepositoryHealthEngine();
    this.debtEngine = new TechnicalDebtEngine();
    this.trendEngine = new TrendEngine();
    this.memoryEngine = new RepositoryMemory();
    this.extensionRegistry = new ExtensionRegistry(this);
  }

  /**
   * Initializes and starts the RepositoryRuntime.
   *
   * @since v1.0.0
   */
  static async start(options?: RepositoryRuntimeStartOptions): Promise<RepositoryRuntime> {
    const workspaceRoot = options?.workspaceRoot || process.cwd();
    const logger = options?.logger || silentLogger;

    const eventBus = new EventBus();
    const scanner = new RepositoryScanner({ workspaceRoot });
    
    const context: RuntimeContext = {
      scanner,
      brain: BrainFactory,
      governance: GovernanceEngine,
      skills: DefaultSkillRegistry,
      eventBus,
      logger,
      workspaceRoot
    };

    const engine = new Engine(context);
    const runtime = new RepositoryRuntime(context, engine);

    // Register and enable plugins if provided
    if (options?.plugins) {
      for (const plugin of options.plugins) {
        try {
          await runtime.install(plugin);
          await runtime.enable(plugin.manifest.id);
          logger.info(`Successfully registered and enabled plugin: "${plugin.manifest.displayName}"`);
        } catch (err: any) {
          logger.error(`Failed to register plugin "${plugin.manifest.id}": ${err.message}`);
        }
      }
    }

    // Run initial baseline check (refreshes if no baseline file exists)
    if (!engine.getSnapshotManager().exists()) {
      await engine.refresh();
    } else {
      // Pre-load snapshot into memory
      engine.getSnapshotManager().load();
    }

    return runtime;
  }

  /**
   * Triggers a live filesystem discovery scan and compiles the inventory.
   *
   * @since v1.0.0
   */
  async scan(): Promise<RepositoryInventory> {
    return this.context.scanner.scan();
  }

  /**
   * Returns the current baseline snapshot, or compiles it if not loaded.
   *
   * @since v1.0.0
   */
  snapshot(): BrainSnapshot | null {
    return this.engine.getSnapshotManager().getLatest();
  }

  /**
   * Rebuilds the current BrainSnapshot from raw filesystem inventory facts
   * and saves it as the new validated baseline.
   *
   * @since v1.0.0
   */
  async refresh(): Promise<BrainSnapshot> {
    return this.engine.refresh();
  }

  /**
   * Checks the live filesystem layout against the baseline snapshot
   * to compile a detailed DriftReport.
   *
   * @since v1.0.0
   */
  async detectDrift(): Promise<DriftReport> {
    const diagnostics = await this.engine.diagnostics({ runGovernance: false });
    return diagnostics.driftReport;
  }

  /**
   * Runs the governance rules compliance engine and outputs a score report.
   *
   * @since v1.0.0
   */
  async validate(profile?: string): Promise<GovernanceSummaryReport> {
    const diagnostics = await this.engine.diagnostics({ runGovernance: true });
    return diagnostics.governanceReport;
  }

  /**
   * Compiles and outputs repository health scores and policy summary fields.
   *
   * @since v1.0.0
   */
  async health(): Promise<HealthSummary> {
    const snapshot = this.snapshot();
    if (!snapshot) {
      throw new Error("RepositoryRuntime: no baseline snapshot loaded.");
    }
    const drift = await this.detectDrift();
    const govReport = await this.validate();
    const debt = await this.debtEngine.evaluate(snapshot, govReport);

    const intelHealth = this.healthEngine.calculate(
      govReport.overallScore,
      drift.score,
      debt.score
    );

    return {
      score: intelHealth.score,
      driftScore: intelHealth.driftScore,
      status: intelHealth.status,
      timestamp: intelHealth.timestamp,
      governancePassed: intelHealth.governanceScore >= 70,
      driftPassed: intelHealth.driftScore >= 80
    };
  }

  /**
   * Compiles multi-dimensional insights for the repository.
   *
   * @since v1.0.0
   */
  async insights(): Promise<RepositoryInsights> {
    const snapshot = this.snapshot();
    if (!snapshot) {
      throw new Error("RepositoryRuntime: no baseline snapshot loaded.");
    }
    const drift = await this.detectDrift();
    const govReport = await this.validate();
    const debt = await this.debtEngine.evaluate(snapshot, govReport);
    const health = this.healthEngine.calculate(govReport.overallScore, drift.score, debt.score);
    const history = await this.history();
    
    const currentViolations = govReport.results.flatMap(r => r.report.violations).map(v => v.ruleId);
    const currentDrifts = drift.findings.map(f => f.id);

    const trends = this.trendEngine.calculate(history, currentViolations, currentDrifts);
    const recommendations = this.recommendationEngine.generate(
      govReport.results.flatMap(r => r.report.violations),
      drift.findings,
      debt
    );

    return {
      health,
      technicalDebt: debt,
      trends,
      recommendations
    };
  }

  /**
   * Returns prioritized recommendations.
   *
   * @since v1.0.0
   */
  async recommendations(): Promise<readonly Recommendation[]> {
    const data = await this.insights();
    return data.recommendations;
  }

  /**
   * Returns historical trends stats.
   *
   * @since v1.0.0
   */
  async trends(): Promise<TrendSummary> {
    const data = await this.insights();
    return data.trends;
  }

  /**
   * Returns memory stats summary.
   *
   * @since v1.0.0
   */
  async memory(): Promise<RepositoryMemorySummary> {
    const snapshot = this.snapshot();
    if (!snapshot) {
      throw new Error("RepositoryRuntime: no baseline snapshot loaded.");
    }
    const history = await this.history();
    const drift = await this.detectDrift();
    const govReport = await this.validate();

    const currentViolations = govReport.results.flatMap(r => r.report.violations).map(v => v.ruleId);
    const currentDrifts = drift.findings.map(f => f.id);

    return this.memoryEngine.summarize(history, currentViolations, currentDrifts);
  }

  /**
   * Returns recommendations filtered by priority level.
   *
   * @since v1.0.0
   */
  async priorityRecommendations(): Promise<readonly Recommendation[]> {
    const recs = await this.recommendations();
    const order = { critical: 4, high: 3, medium: 2, low: 1 };
    return [...recs].sort((a, b) => order[b.priority] - order[a.priority]);
  }

  /**
   * Returns the array of historical governance logs.
   *
   * @since v1.0.0
   */
  async history(): Promise<HealthHistoryEntry[]> {
    return this.engine.getHistoryManager().getHealthHistory();
  }

  /**
   * Resolves a workspace path prefix and type from the snapshot.
   *
   * @since v1.0.0
   */
  workspace(name: string): WorkspaceMetadata | undefined {
    const snapshot = this.snapshot();
    if (!snapshot) return undefined;
    return snapshot.workspace.find(
      w => w.name === name || w.path === name || w.path === `apps/${name}` || w.path === `backend/${name}` || w.path === `packages/${name}`
    );
  }

  /**
   * Returns the architectural layer name for a file path.
   *
   * @since v1.0.0
   */
  layer(filePath: string): string | undefined {
    const snapshot = this.snapshot();
    if (!snapshot) return undefined;
    const normalized = filePath.replace(/\\/g, "/");
    for (const [prefix, layerName] of Object.entries(snapshot.architecture.ownership)) {
      if (normalized.startsWith(prefix)) return layerName;
    }
    return undefined;
  }

  /**
   * Runs a specific repository automation skill.
   *
   * @since v1.0.0
   */
  async runSkill(
    skillId: string,
    input: Record<string, unknown>,
    options?: { dryRun?: boolean }
  ): Promise<SkillResult> {
    const snapshot = this.snapshot();
    if (!snapshot) {
      throw new Error("RepositoryRuntime: no baseline snapshot loaded.");
    }

    const dryRun = options?.dryRun !== false; // defaults to safe dryRun mode
    const skillContext = {
      snapshot,
      logger: this.context.logger,
      dryRun
    };

    return this.context.skills.execute(skillId, skillContext, input);
  }

  /**
   * Evaluates a natural language instruction and selects/runs appropriate skills.
   *
   * @since v1.0.0
   */
  async ask(request: CapabilityRequest): Promise<CapabilityRouteResult> {
    const snapshot = this.snapshot();
    if (!snapshot) {
      throw new Error("RepositoryRuntime: no baseline snapshot loaded.");
    }

    // Default ask requests to safe dry-run mode. Requires explicit verification to modify files.
    const skillContext = {
      snapshot,
      logger: this.context.logger,
      dryRun: true
    };

    return this.runAskInternal(request, skillContext);
  }

  private async runAskInternal(request: CapabilityRequest, skillContext: any): Promise<CapabilityRouteResult> {
    // Import router from repository-skills
    const { CapabilityRouter } = await import("@esparex/repository-skills");
    const router = new CapabilityRouter(this.context.skills);
    return router.route(request, skillContext);
  }

  /**
   * Returns a structured explanation payload explaining why a governance rule or drift check failed.
   *
   * @since v1.0.0
   */
  explain(result: any): ExplanationPayload {
    return this.explainabilityEngine.explain(result);
  }

  /** Expose EventBus for consumers to subscribe to event hooks. */
  get eventBus(): EventBus {
    return this.context.eventBus;
  }

  /**
   * Returns list of registered plugins with their status/error descriptions.
   *
   * @since v1.0.0
   */
  plugins(): readonly PluginWrapper[] {
    return this.extensionRegistry.list();
  }

  /**
   * Registers a plugin extension into the workspace runtime.
   *
   * @since v1.0.0
   */
  async install(plugin: RepositoryPlugin): Promise<void> {
    return this.extensionRegistry.register(plugin);
  }

  /**
   * Completely removes a plugin extension from the workspace runtime.
   *
   * @since v1.0.0
   */
  async uninstall(id: string): Promise<void> {
    return this.extensionRegistry.uninstall(id);
  }

  /**
   * Activates and enables a registered plugin.
   *
   * @since v1.0.0
   */
  async enable(id: string): Promise<void> {
    return this.extensionRegistry.enable(id);
  }

  /**
   * Disables a plugin, unlinking all its automatic EventBus listener subscriptions.
   *
   * @since v1.0.0
   */
  async disable(id: string): Promise<void> {
    return this.extensionRegistry.disable(id);
  }
}
