import { BrainSnapshot } from "@esparex/repository-brain";
import { RuntimeContext } from "../context/runtime_context.js";
import { DriftDetector } from "../drift/detector.js";
import { ComparatorRegistry } from "../drift/registry.js";
import { WorkspaceComparator } from "../drift/comparators/workspace.js";
import { DependencyComparator } from "../drift/comparators/dependency.js";
import { FilesystemComparator } from "../drift/comparators/filesystem.js";
import { PolicyComparator } from "../drift/comparators/policy.js";
import { SnapshotManager } from "../history/snapshot_manager.js";
import { HistoryManager, HealthHistoryEntry } from "../history/history_manager.js";
import { DriftReport, GovernanceCompletedEvent } from "../events/event_types.js";
import { DefaultRegistry } from "@esparex/repository-governance";

export interface RuntimeDiagnostics {
  driftReport: DriftReport;
  governanceReport?: any;
  liveSnapshot: BrainSnapshot;
  baselineSnapshot: BrainSnapshot | null;
}

/**
 * RepositoryRuntime
 *
 * The thin coordination runtime that orchestrates Scanner, Brain,
 * Governance, and Skills.
 *
 * Rules:
 *   - NEVER scans files directly.
 *   - NEVER parses package.json or executes Git.
 *   - Delegates all structural checks and validation rules to their owning packages.
 */
export class RepositoryRuntime {
  private readonly snapshotManager: SnapshotManager;
  private readonly historyManager: HistoryManager;
  private readonly driftDetector: DriftDetector;
  private readonly comparatorRegistry: ComparatorRegistry;

  constructor(
    private readonly context: RuntimeContext
  ) {
    this.snapshotManager = new SnapshotManager(context.workspaceRoot);
    this.historyManager = new HistoryManager(context.workspaceRoot);

    // Initialize comparator registry and load default comparators
    this.comparatorRegistry = new ComparatorRegistry()
      .register(new WorkspaceComparator())
      .register(new DependencyComparator())
      .register(new FilesystemComparator())
      .register(new PolicyComparator());

    this.driftDetector = new DriftDetector(this.comparatorRegistry);
  }

  /** Expose the comparator registry for runtime customization/plugin injection. */
  getComparators(): ComparatorRegistry {
    return this.comparatorRegistry;
  }

  /** Expose the snapshot manager. */
  getSnapshotManager(): SnapshotManager {
    return this.snapshotManager;
  }

  /** Expose the history manager. */
  getHistoryManager(): HistoryManager {
    return this.historyManager;
  }

  /**
   * Run the complete self-monitoring diagnostics pipeline.
   *
   * Flow:
   *   1. Scanner.scan() -> Inventory
   *   2. Brain.create() -> Live Snapshot
   *   3. Load baseline snapshot from SnapshotManager.
   *   4. DriftDetector.detect(baseline, live) -> DriftReport.
   *   5. Run Governance against the live snapshot.
   *   6. Emit Events (drift, governance) and Skill recommendations.
   */
  async diagnostics(options: { runGovernance?: boolean } = {}): Promise<RuntimeDiagnostics> {
    const { logger, scanner, brain, governance, eventBus } = this.context;

    logger.info("Starting runtime diagnostics pipeline...");

    // Step 1: Scan repository for live facts
    logger.info("Scanning repository filesystem...");
    const inventory = await scanner.scan();

    // Step 2: Compile inventory + configurations into live snapshot
    logger.info("Compiling live BrainSnapshot...");
    const liveSnapshot = await brain.create({
      inventory,
      workspaceRoot: this.context.workspaceRoot
    });

    // Step 3: Load baseline snapshot
    let baselineSnapshot = this.snapshotManager.load();
    if (!baselineSnapshot) {
      logger.warn("No baseline snapshot found. Initializing current live snapshot as baseline.");
      this.snapshotManager.save(liveSnapshot);
      await eventBus.publish("snapshot.created", { snapshot: liveSnapshot });
      baselineSnapshot = liveSnapshot;
    }

    // Step 4: Run Drift Detection Engine (baseline vs live)
    logger.info("Checking for structural and policy drift...");
    const driftReport = await this.driftDetector.detect(baselineSnapshot, liveSnapshot);

    if (driftReport.findings.length > 0) {
      logger.warn(`Drift detected: ${driftReport.findings.length} findings, Health Score: ${driftReport.score}/100.`);
      await eventBus.publish("drift.detected", { report: driftReport });

      // Suggest skills for findings
      for (const finding of driftReport.findings) {
        if (finding.suggestedSkillId) {
          const input = finding.suggestedSkillInput ?? {};
          logger.info(`Recommending skill "${finding.suggestedSkillId}" for drift: ${finding.message}`);
          await eventBus.publish("skill.recommended", {
            skillId: finding.suggestedSkillId,
            reason: finding.message,
            input
          });
        }
      }
    } else {
      logger.info("Drift check passed. Repository matches snapshot baseline.");
    }

    // Step 5: Execute Governance compliance checks
    let governanceReport: any = null;
    if (options.runGovernance !== false) {
      logger.info("Running governance validation engine against snapshot...");
      // Construct default config for rules
      const rulesConfig = {
        rules: {
          "unicode-hygiene": {},
          "git": { allowedBranches: ["main", "master", "develop"] },
          "env": {}
        }
      };

      const result = await governance.run({
        snapshot: liveSnapshot,
        registry: DefaultRegistry,
        profile: "ci",
        config: rulesConfig
      });

      governanceReport = result.report;
      logger.info(`Governance completed. Overall Score: ${result.report.overallScore}/100. Exit code: ${result.exitCode}`);

      await eventBus.publish("governance.completed", {
        report: result.report,
        exitCode: result.exitCode
      });

      // Log health tracking entry
      const healthEntry: HealthHistoryEntry = {
        timestamp: new Date().toISOString(),
        commit: liveSnapshot.repository.commit,
        score: result.report.overallScore,
        violationsCount: result.report.results.reduce((acc, r) => acc + r.violationsCount, 0),
        passed: result.exitCode === 0 || result.exitCode === 1
      };
      this.historyManager.logHealth(healthEntry);
    }

    return {
      driftReport,
      governanceReport,
      liveSnapshot,
      baselineSnapshot
    };
  }

  /**
   * Refresh the snapshot: promotes the live scan to be the new baseline.
   * Updates snapshot files on disk, publishes snapshot.updated, and archives to history.
   */
  async refresh(): Promise<BrainSnapshot> {
    const { logger, scanner, brain, eventBus } = this.context;

    logger.info("Refreshing repository snapshot baseline...");

    const inventory = await scanner.scan();
    const liveSnapshot = await brain.create({
      inventory,
      workspaceRoot: this.context.workspaceRoot
    });

    const previous = this.snapshotManager.load();

    this.snapshotManager.save(liveSnapshot);
    this.historyManager.archive(liveSnapshot);

    if (previous) {
      logger.info("Baseline snapshot updated.");
      await eventBus.publish("snapshot.updated", { previous, current: liveSnapshot });
    } else {
      logger.info("Baseline snapshot initialized.");
      await eventBus.publish("snapshot.created", { snapshot: liveSnapshot });
    }

    return liveSnapshot;
  }
}
