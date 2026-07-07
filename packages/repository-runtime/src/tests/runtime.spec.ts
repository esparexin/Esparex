import * as assert from "assert";
import * as path from "path";
import * as fs from "fs";
import { RepositoryScanner } from "@esparex/repository-scanner";
import { BrainFactory } from "@esparex/repository-brain";
import { GovernanceEngine } from "@esparex/repository-governance";
import { DefaultSkillRegistry } from "@esparex/repository-skills";

import { EventBus } from "../events/event_bus.js";
import { RuntimeContext, RuntimeLogger } from "../context/runtime_context.js";
import { RepositoryRuntime } from "../orchestrator/runtime.js";
import { ReportWriter } from "../reporting/report_writer.js";

// ─── Silent Test Logger ───────────────────────────────────────────────────
const silentLogger: RuntimeLogger = {
  info:  () => {},
  warn:  () => {},
  error: () => {}
};

function pass(name: string) { console.log(`  ✔ PASS: ${name}`); }
function fail(name: string, err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`  ✖ FAIL: ${name} — ${msg}`);
  process.exitCode = 1;
}

async function runTests() {
  console.log("--------------------------------------------------");
  console.log("Running @esparex/repository-runtime Phase 6 tests...");
  console.log("--------------------------------------------------\n");

  const workspaceRoot = path.resolve(process.cwd(), "../../");
  const eventBus = new EventBus();
  const scanner = new RepositoryScanner({ workspaceRoot });

  const context: RuntimeContext = {
    scanner,
    brain: BrainFactory,
    governance: GovernanceEngine,
    skills: DefaultSkillRegistry,
    eventBus,
    logger: silentLogger,
    workspaceRoot
  };

  const runtime = new RepositoryRuntime(context);

  // Clean up any existing test cache files to ensure test isolation
  const cacheFile = path.join(workspaceRoot, ".esparex/runtime/cache/files.json");
  const latestFile = path.join(workspaceRoot, ".esparex/runtime/snapshots/latest.json");
  const trendsFile = path.join(workspaceRoot, ".esparex/runtime/history/health-trends.json");

  const safeDelete = (p: string) => {
    try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch {}
  };

  safeDelete(cacheFile);
  safeDelete(latestFile);
  safeDelete(trendsFile);

  // ═══════════════════════════════════════════════════════════════════════
  // 1. SnapshotManager Lifecycle Tests
  // ═══════════════════════════════════════════════════════════════════════
  console.log("1. SnapshotManager Lifecycle");

  try {
    const mgr = runtime.getSnapshotManager();
    assert.strictEqual(mgr.getLatest(), null, "Initial latest snapshot is null");
    assert.strictEqual(mgr.exists(), false, "Latest snapshot file does not exist initially");

    // Scan & Create snapshot
    const inventory = await scanner.scan();
    const snap = await BrainFactory.create({ inventory, workspaceRoot });

    mgr.save(snap);
    assert.strictEqual(mgr.exists(), true, "Latest snapshot file exists after save");

    const loaded = mgr.load();
    assert.ok(loaded, "Snapshot loaded successfully");
    assert.strictEqual(loaded.identity.name, "esparex-admin-root", "Loaded snapshot identity matches");
    pass("SnapshotManager save, validate, load cycle");
  } catch (e) { fail("SnapshotManager lifecycle", e); }

  // ═══════════════════════════════════════════════════════════════════════
  // 2. EventBus Pub/Sub Verification
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n2. EventBus Publish/Subscribe");

  try {
    let snapshotCreatedReceived = false;
    let driftDetectedReceived = false;

    eventBus.subscribe("snapshot.created", (payload) => {
      assert.ok(payload.snapshot, "Created event payload contains snapshot");
      snapshotCreatedReceived = true;
    });

    eventBus.subscribe("drift.detected", (payload) => {
      assert.ok(payload.report, "Drift event payload contains report");
      driftDetectedReceived = true;
    });

    // Make sure baseline is null to force snapshot.created event
    safeDelete(latestFile);

    // Running diagnostics triggers initialization events
    const results = await runtime.diagnostics({ runGovernance: false });
    assert.ok(results.liveSnapshot, "Diagnostics returns liveSnapshot");
    assert.ok(snapshotCreatedReceived, "Dispatched snapshot.created event");
    pass("EventBus successfully processes runtime events");
  } catch (e) { fail("EventBus verification", e); }

  // ═══════════════════════════════════════════════════════════════════════
  // 3. Drift Detection (Baseline vs Live)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n3. Drift Detection (Workspace/Dependency/Filesystem/Policy)");

  try {
    // Compile a modified snapshot manually to simulate drift comparison
    const original = runtime.getSnapshotManager().load()!;

    // Clone and alter version + workspace attributes to cause warnings (total score 80)
    const modifiedSnapshot = JSON.parse(JSON.stringify(original));
    if (modifiedSnapshot.workspace.length > 0) {
      modifiedSnapshot.workspace[0].path = "apps/modified-test-path"; // warning
    }
    modifiedSnapshot.technology.express = "^6.0.0-hack"; // warning

    const detector = new (runtime as any).driftDetector.constructor(
      (runtime as any).comparatorRegistry
    );

    const report = await detector.detect(original, modifiedSnapshot);
    assert.strictEqual(report.status, "warning", "Status should be warning when modified");
    assert.ok(report.score < 100, "Score drops below 100 on drift");
    assert.strictEqual(report.requiresSnapshotRefresh, true, "Requires refresh when drift is detected");

    // Findings checks
    const workspacesFindings = report.findings.filter((f: any) => f.category === "workspace");
    const techFindings = report.findings.filter((f: any) => f.category === "dependency");

    assert.ok(workspacesFindings.length > 0, "Finds workspace drift");
    assert.ok(techFindings.length > 0, "Finds dependency version drift");

    // Verify recommendations
    assert.strictEqual(techFindings[0].suggestedSkillId, "technology-inspection", "Dependency drift recommends technology-inspection");
    assert.strictEqual(workspacesFindings[0].suggestedSkillId, "workspace-resolution", "Workspace drift recommends workspace-resolution");

    pass("DriftDetector registers findings, scores, and skill recommendations correctly");
  } catch (e) { fail("Drift Detection validation", e); }

  // ═══════════════════════════════════════════════════════════════════════
  // 4. Governance Execution Integration
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n4. Governance Integration");

  try {
    let governanceCompletedReceived = false;
    eventBus.subscribe("governance.completed", (payload) => {
      assert.ok(payload.report.overallScore > 0, "Governance completed carries valid score");
      governanceCompletedReceived = true;
    });

    const results = await runtime.diagnostics({ runGovernance: true });
    assert.ok(results.governanceReport, "Diagnostics runs governance and returns report");
    assert.ok(governanceCompletedReceived, "Dispatched governance.completed event");

    // Verify history logs
    const history = runtime.getHistoryManager().getHealthHistory();
    assert.ok(history.length > 0, "Logged health history entry");
    assert.strictEqual(history[0].score, results.governanceReport.overallScore, "Logged score matches report");
    pass("Orchestrates scanner, brain, and governance validated checks cleanly");
  } catch (e) { fail("Governance integration", e); }

  // ═══════════════════════════════════════════════════════════════════════
  // 5. Incremental Filesystem Cache & SHA-256 Check
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n5. Incremental Filesystem Cache");

  try {
    assert.ok(fs.existsSync(cacheFile), "FilesystemComparator created cache/files.json");
    const cache = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
    const keys = Object.keys(cache);
    assert.ok(keys.length > 0, "Cached at least one file entry");
    assert.ok(cache[keys[0]].sha256, "Cache entries contain computed sha256 checksums");
    assert.ok(cache[keys[0]].mtime, "Cache entries contain modification mtimeMs timestamps");
    pass("Incremental scanner caches filesystem attributes for subsequent drift checks");
  } catch (e) { fail("Incremental filesystem cache validation", e); }

  // ═══════════════════════════════════════════════════════════════════════
  // 6. ReportWriter Outputs
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n6. ReportWriter Formatting");

  try {
    const writer = new ReportWriter();
    const mockReport: any = {
      status: "clean",
      findings: [],
      score: 100,
      requiresSnapshotRefresh: false,
      timestamp: new Date().toISOString()
    };

    const output = await writer.writeDriftReport(mockReport, { format: "markdown" });
    assert.ok(output.includes("Esparex Repository Drift Report"), "Markdown contains report title");
    assert.ok(output.includes("100/100"), "Markdown contains score formatting");
    pass("ReportWriter converts DriftReports into clean GitHub Markdown");
  } catch (e) { fail("ReportWriter verification", e); }

  // Clean up files generated by this test
  safeDelete(cacheFile);
  safeDelete(latestFile);
  safeDelete(trendsFile);

  console.log("\n--------------------------------------------------");
  console.log("All @esparex/repository-runtime tests completed!");
  console.log("--------------------------------------------------\n");
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
