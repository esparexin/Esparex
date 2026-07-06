#!/usr/bin/env node
import * as path from "path";
import * as fs from "fs";
import { GovernanceEngine } from "../engine/index.js";
import { DefaultRegistry } from "../registry/index.js";
import { ConsoleReporter } from "../reporters/console.js";
import { JsonReporter } from "../reporters/json.js";

async function runCli() {
  const args = process.argv.slice(2);
  
  // Basic argument parsing
  let profile = "ci";
  let outPath = "";
  let format = "console";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--profile" && i + 1 < args.length) {
      profile = args[i + 1];
      i++;
    } else if (args[i] === "--out" && i + 1 < args.length) {
      outPath = args[i + 1];
      i++;
    } else if (args[i] === "--format" && i + 1 < args.length) {
      format = args[i + 1];
      i++;
    }
  }

  const workspaceRoot = process.cwd();

  // Load config (.governancerc or default)
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
      process.exit(10); // Configuration Exit Code
    }
  }

  try {
    const result = await GovernanceEngine.run({
      workspaceRoot,
      registry: DefaultRegistry,
      profile,
      config
    });

    // Run reporters
    const consoleReporter = new ConsoleReporter();
    await consoleReporter.write(result.report, { color: true });

    if (outPath || format === "json" || format === "both") {
      const jsonReporter = new JsonReporter();
      await jsonReporter.write(result.report, { outputPath: outPath || "./governance-report.json" });
    }

    process.exit(result.exitCode);
  } catch (err: any) {
    console.error(`Internal Engine Failure: ${err.message}`);
    process.exit(20); // Internal Exit Code
  }
}

runCli();
