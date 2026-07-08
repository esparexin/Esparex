#!/usr/bin/env node
import { RepositoryRuntime } from "../sdk/runtime-sdk.js";
import { RepositoryAssistant } from "../ai/assistant.js";
import { ReportWriter } from "../reporting/report-writer.js";
import { RuntimeLogger } from "../context/runtime-context.js";

const cliLogger: RuntimeLogger = {
  info: (msg, ...args) => console.log(`[INFO] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`\x1b[33m[WARN] ${msg}\x1b[0m`, ...args),
  error: (msg, ...args) => console.error(`\x1b[31m[ERROR] ${msg}\x1b[0m`, ...args)
};

async function runCli() {
  const args = process.argv.slice(2);
  const command = args[0] || "status";
  const workspaceRoot = process.cwd();

  try {
    // Start runtime via official SDK façade entry point — no direct lower-level package loads
    const runtime = await RepositoryRuntime.start({
      workspaceRoot,
      logger: cliLogger
    });

    const reportWriter = new ReportWriter();

    switch (command) {
      case "status": {
        const snapshot = runtime.snapshot();
        if (snapshot) {
          console.log(`Repository:      ${snapshot.identity.name}`);
          console.log(`Branch:          ${snapshot.repository.branch}`);
          console.log(`Commit:          ${snapshot.repository.commit.substring(0, 8)}`);
          console.log(`Baseline Status: ACTIVE`);
        } else {
          console.log(`Baseline Status: NONE`);
          console.log(`  Run "repository refresh" to initialize snapshot baseline.`);
        }
        break;
      }

      case "health": {
        const health = await runtime.health();
        console.log(`Repository Health Score: ${health.score}/100`);
        console.log(`Drift Score:             ${health.driftScore}/100`);
        console.log(`Overall Health Status:   ${health.status.toUpperCase()}`);
        process.exit(health.status === "healthy" ? 0 : 1);
        break;
      }

      case "scan": {
        const inventory = await runtime.scan();
        console.log(JSON.stringify(inventory, null, 2));
        break;
      }

      case "validate": {
        const report = await runtime.validate();
        console.log(`\nGovernance validated. Score: ${report.overallScore}/100`);
        const passed = report.results.every(r => r.passed);
        console.log(`Compliance check: ${passed ? "PASSED" : "FAILED"}`);
        process.exit(passed ? 0 : 2);
        break;
      }

      case "drift": {
        const driftReport = await runtime.detectDrift();
        const output = await reportWriter.writeDriftReport(driftReport, { format: "markdown" });
        console.log(output);
        process.exit(driftReport.status === "clean" ? 0 : 1);
        break;
      }

      case "explain": {
        const results = await runtime.validate();
        const violations = results.results.flatMap(r => r.report.violations);
        if (violations.length === 0) {
          console.log("No governance violations found to explain.");
          break;
        }
        console.log(`Found ${violations.length} violations. Explanations:\n`);
        for (const v of violations) {
          const payload = runtime.explain(v);
          console.log(payload.toString());
          console.log("----------------------------------------");
        }
        break;
      }

      case "history": {
        const history = await runtime.history();
        if (history.length === 0) {
          console.log("No health logs found. Run validate first.");
          break;
        }
        console.log("Historical Trends:");
        for (const log of history) {
          console.log(`  [${log.timestamp}] Commit: ${log.commit.substring(0, 8)} | Score: ${log.score}/100 | Passed: ${log.passed}`);
        }
        break;
      }

      case "scaffold": {
        const workspaceName = args[1];
        const fileName = args[2];
        const template = args[3] || "// Scaffolded by CLI";

        if (!workspaceName || !fileName) {
          console.error("Scaffold requires workspace name and file name: repository scaffold <workspace> <file>");
          process.exit(1);
        }

        const res = await runtime.runSkill("scaffolding", {
          workspaceName,
          fileName,
          template
        }, { dryRun: false }); // explicit dryRun override to actually execute file writes

        if (res.status === "success") {
          console.log("Successfully scaffolded file.");
        } else {
          console.error(`Scaffolding failed: ${res.error}`);
          process.exit(1);
        }
        break;
      }

      case "ask": {
        const instruction = args.slice(1).join(" ");
        if (!instruction) {
          console.error("Usage: repository ask <instruction>");
          process.exit(1);
        }
        console.log(`Asking assistant: "${instruction}"...`);
        const assistant = new RepositoryAssistant(runtime);
        const res = await assistant.ask(instruction, { execute: false }); // safe dry-run mode by default
        console.log(`\nSkills Run: ${res.skillsExecuted.join(", ")}`);
        console.log(`Success:    ${res.success}`);
        if (res.recommendations.length > 0) {
          console.log("Recommendations:");
          res.recommendations.forEach(r => console.log(`  - ${r}`));
        }
        if (res.explanation) {
          console.log(`\nExplanation:\n${res.explanation}`);
        }
        break;
      }

      case "doctor": {
        console.log("=== Repository Doctor ===");
        const health = await runtime.health();
        console.log(`Overall Health Status: ${health.status.toUpperCase()}`);
        console.log(`Composite Score:       ${health.score}/100`);
        console.log(`Drift Score:           ${health.driftScore}/100`);
        
        console.log("\n=== Priority Recommendations ===");
        const recs = await runtime.priorityRecommendations();
        if (recs.length === 0) {
          console.log("  ✔ No recommendations. Repository is in excellent state.");
        } else {
          for (const r of recs) {
            console.log(`  [${r.priority.toUpperCase()}] ${r.title} — Rec: ${r.recommendation} (Effort: ${r.estimatedEffortMin}m)`);
          }
        }
        break;
      }

      case "insights": {
        console.log("=== Repository Insights ===");
        const insights = await runtime.insights();
        console.log(`Health Status:   ${insights.health.status.toUpperCase()}`);
        console.log(`  - Governance:  ${insights.health.governanceScore}/100`);
        console.log(`  - Drift:       ${insights.health.driftScore}/100`);
        console.log(`  - Tech Debt:   ${insights.health.techDebtScore}/100`);
        console.log(`  - Composite:   ${insights.health.score}/100`);
        
        console.log("\n--- Technical Debt ---");
        console.log(`  Score:         ${insights.technicalDebt.score}/100`);
        console.log(`  Duplicates:    ${insights.technicalDebt.duplicateCodeBlocksCount}`);
        console.log(`  Orphan Files:  ${insights.technicalDebt.orphanFiles.length}`);
        console.log(`  Stale packages: ${insights.technicalDebt.staleDependencies.join(", ") || "none"}`);

        console.log("\n--- Health Trends ---");
        console.log(`  Direction:     ${insights.trends.scoreTrend.toUpperCase()} (${insights.trends.scoreChange >= 0 ? "+" : ""}${insights.trends.scoreChange})`);
        console.log(`  Stability:     ${Math.round(insights.trends.stabilityRatio * 100)}%`);
        break;
      }

      default: {
        console.error(`Unknown command: "${command}"`);
        console.log("\nUsage: repository <command>");
        console.log("Commands:");
        console.log("  status    Displays baseline snapshot status");
        console.log("  health    Returns multi-dimensional health scores");
        console.log("  scan      Dumps raw inventory facts");
        console.log("  validate  Checks governance rules");
        console.log("  drift     Detects structural/policy changes");
        console.log("  explain   Explains why validations failed");
        console.log("  history   Lists historical health scores");
        console.log("  scaffold  Automates file generation");
        console.log("  ask       Ask AI assistant to scope and simulate a task");
        console.log("  insights  Displays technical debt and stability metrics trends");
        console.log("  doctor    Runs full diagnosis check with recommendations");
        process.exit(1);
      }
    }
  } catch (err: any) {
    console.error(`CLI Engine Failure: ${err.message}`);
    process.exit(10);
  }
}

runCli();
