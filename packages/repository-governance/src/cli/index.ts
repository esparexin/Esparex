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
import { ConsoleReporter } from "../reporters/console.js";
import { JsonReporter } from "../reporters/json.js";

async function runCli() {
  const args = process.argv.slice(2);

  let profile = "ci";
  let outPath  = "";
  let format   = "console";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--profile" && i + 1 < args.length) { profile = args[++i]; }
    else if (args[i] === "--out"     && i + 1 < args.length) { outPath  = args[++i]; }
    else if (args[i] === "--format"  && i + 1 < args.length) { format   = args[++i]; }
  }

  const workspaceRoot = process.cwd();

  // ── Load governance rules config ──────────────────────────────────────
  let config: Record<string, any> = {
    rules: {
      "unicode-hygiene": {},
      "git": {
        allowedBranches: ["main", "master", "develop", "feature/transport-separation-pr2"]
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
      config
    });

    // ── Step 4: Emit reports ──────────────────────────────────────────────
    const consoleReporter = new ConsoleReporter();
    await consoleReporter.write(result.report, { color: true });

    if (outPath || format === "json" || format === "both") {
      const jsonReporter = new JsonReporter();
      await jsonReporter.write(result.report, { outputPath: outPath || "./governance-report.json" });
    }

    process.exit(result.exitCode);
  } catch (err: any) {
    console.error(`Internal Engine Failure: ${err.message}`);
    process.exit(20);
  }
}

runCli();
