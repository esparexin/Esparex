#!/usr/bin/env node
// ─── CLI Startup Pipeline ────────────────────────────────────────────────────
//
// The startup sequence follows the canonical four-layer pipeline:
//
//   RepositoryScanner  →  RepositoryInventory
//          ↓
//   RepositoryBrain    →  BrainSnapshot
//          ↓
//   GovernanceEngine   →  Health Report
//
// This ensures a single shared inventory is produced once per run,
// and all analyzers consume the same frozen snapshot without redundant
// filesystem or Git operations.
//
// ─────────────────────────────────────────────────────────────────────────────
import * as path from "path";
import * as fs from "fs";
import { RepositoryScanner } from "@esparex/repository-scanner";
import { BrainFactory } from "@esparex/repository-brain";
import { GovernanceEngine } from "../engine/index.js";
import { DefaultRegistry } from "../registry/index.js";
import { ConsoleReporter, JsonReporter, HtmlReporter, MarkdownReporter, MetricsAggregator } from "../reporters/index.js";
import { AutoFixEngine } from "../engine/autoFix.js";
import { FixReporter } from "../reporters/fixReport.js";
import { UnicodeFixCapability, DeepImportFixCapability } from "../fixes/index.js";

async function runCli() {
  const args = process.argv.slice(2);

  let profile = "ci";
  let outPath  = "";
  let format   = "console";
  let useCache = true;
  let benchmarkEnabled = false;
  let benchmarkIterations = 3;
  let fixEnabled = false;
  let dryRunOnly = false;
  let previewOnly = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--profile" && i + 1 < args.length) { profile = args[++i]; }
    else if (args[i] === "--out"     && i + 1 < args.length) { outPath  = args[++i]; }
    else if (args[i] === "--format"  && i + 1 < args.length) { format   = args[++i]; }
    else if (args[i] === "--no-cache") { useCache = false; }
    else if (args[i] === "--benchmark") { benchmarkEnabled = true; }
    else if (args[i] === "--benchmark-iterations" && i + 1 < args.length) { benchmarkIterations = parseInt(args[++i], 10); }
    else if (args[i] === "--fix") { fixEnabled = true; }
    else if (args[i] === "--dry-run") { dryRunOnly = true; }
    else if (args[i] === "--preview") { previewOnly = true; }
  }

  const workspaceRoot = process.cwd();

  // ── Load governance rules config ──────────────────────────────────────
  let config: Record<string, any> = {
    rules: {
      "unicode-hygiene": {},
      "git": {
        allowedBranches: ["main", "master", "develop", "feature/*", "fix/*", "chore/*", "docs/*", "audit/*"]
      },
      "env": {}
    }
  };

  const configPath = path.join(workspaceRoot, ".governancerc.json");
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch (err: any) {
      console.error(`Invalid configuration file .governancerc.json: ${err.message}`);
      process.exit(10);
    }
  }

  try {
    // ── Step 1: Discover repository facts ────────────────────────────────
    const scanner   = new RepositoryScanner({ workspaceRoot });
    const inventory = await scanner.scan();

    // ── Step 2: Compile BrainSnapshot ───────────────────────────────────
    const snapshot  = await BrainFactory.create({ inventory, workspaceRoot });

    // ── Step 3: Run governance engine ────────────────────────────────────
    const result = await GovernanceEngine.run({
      snapshot,
      registry: DefaultRegistry,
      profile,
      config,
      cache: useCache,
      benchmark: benchmarkEnabled ? { enabled: true, iterations: benchmarkIterations } : undefined
    });

    // ── Step 4: Auto-fix (PR9) ──────────────────────────────────────────────
    if (fixEnabled || dryRunOnly || previewOnly) {
      const autoFixEngine = new AutoFixEngine();
      const fixCapabilities = [
        new UnicodeFixCapability(),
        new DeepImportFixCapability()
      ];
      const fixReporter = new FixReporter();
      const fixResults: { analyzerId: string; fixResult: any }[] = [];
      const dryRunResults: { analyzerId: string; preview: any }[] = [];

      for (const r of result.report.results) {
        const envelope = {
          schemaVersion: "1.0.0" as const,
          analyzerId: r.analyzerId,
          timestamp: new Date().toISOString(),
          status: "success" as const,
          durationMs: 0,
          warningsCount: r.violationsCount,
          errorsCount: r.violationsCount,
          metadata: {},
          payload: r.report.violations
        };
        const eligible = await autoFixEngine.eligibleChecks(envelope, fixCapabilities);
        if (eligible.length === 0) continue;

        for (const fix of eligible) {
          const preview = await autoFixEngine.dryRun(envelope, fix);
          if (previewOnly) {
            dryRunResults.push({ analyzerId: r.analyzerId, preview });
          } else if (dryRunOnly) {
            dryRunResults.push({ analyzerId: r.analyzerId, preview });
          } else if (fixEnabled) {
            const result = await autoFixEngine.apply(envelope, fix, snapshot.repository.root);
            fixResults.push({ analyzerId: r.analyzerId, fixResult: result });
          }
        }
      }

      if (dryRunResults.length > 0) {
        const report = await fixReporter.writeDryRunPreview(dryRunResults);
        console.log(report);
        const dryRunPath = path.join(workspaceRoot, "governance-dry-run.md");
        fs.writeFileSync(dryRunPath, report, "utf-8");
        console.log(`\nDry-run preview written to: ${dryRunPath}`);
      }

      if (fixResults.length > 0) {
        const report = await fixReporter.writeFixResults(fixResults);
        console.log(report);
        const fixReportPath = path.join(workspaceRoot, "governance-fix-report.md");
        fs.writeFileSync(fixReportPath, report, "utf-8");
        console.log(`\nFix report written to: ${fixReportPath}`);
      }
    }

    // ── Step 5: Emit reports ──────────────────────────────────────────────
    const consoleReporter = new ConsoleReporter();
    await consoleReporter.write(result.report, { color: true });

    const outputDir = outPath || workspaceRoot;

    if (format === "json" || format === "all" || format === "both") {
      const jsonReporter = new JsonReporter();
      await jsonReporter.write(result.report, { outputPath: path.join(outputDir, "governance-report.json") });
    }

    if (format === "html" || format === "all") {
      const htmlReporter = new HtmlReporter();
      await htmlReporter.write(result.report, { outputPath: path.join(outputDir, "governance-report.html") });
    }

    if (format === "md" || format === "markdown" || format === "all") {
      const mdReporter = new MarkdownReporter();
      await mdReporter.write(result.report, { outputPath: path.join(outputDir, "governance-report.md") });
    }

    if (format === "metrics" || format === "all") {
      const metricsReporter = new MetricsAggregator();
      await metricsReporter.write(result.report, { metricsPath: path.join(outputDir, ".governance-metrics.json") });
    }

    process.exit(result.exitCode);
  } catch (err: any) {
    console.error(`Internal Engine Failure: ${err.message}`);
    process.exit(20);
  }
}

runCli();
