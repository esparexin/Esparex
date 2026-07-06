/**
 * check-architecture.js
 * ======================
 * Programmatic API wrapper for Esparex Architecture Governance.
 * Delegates checks directly to @esparex/repository-governance package.
 */

'use strict';

const path = require('path');
const fs = require('fs');

async function run() {
  // Dynamically import the compiled ES Module of our governance package
  const pkgPath = path.resolve(__dirname, '../../packages/repository-governance/dist/index.js');
  
  if (!fs.existsSync(pkgPath)) {
    console.error(`Error: Compiled repository-governance package not found at: ${pkgPath}`);
    console.error("Please run 'npm run build -w @esparex/repository-governance' first.");
    process.exit(20);
  }

  const { runProfile, ConsoleReporter } = await import(`file://${pkgPath}`);
  
  const workspaceRoot = path.resolve(__dirname, '../..');
  let config = {
    rules: {
      "unicode-hygiene": {},
      "git": {
        allowedBranches: ["main", "master", "develop", "feature/transport-separation-pr2"]
      },
      "env": {},
      "architecture": {
        weights: {
          deepImports: 30,
          circular: 20,
          boundaryCore: 20,
          boundaryBackend: 15,
          publicApi: 15
        }
      }
    }
  };

  const configPath = path.join(workspaceRoot, ".governancerc.json");
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    } catch (err) {
      console.error(`Invalid configuration file .governancerc.json: ${err.message}`);
      process.exit(10);
    }
  }

  // Execute governance engine in CI profile (runs unicode, git, and architecture analyzers)
  const result = await runProfile("ci", { workspaceRoot, config });

  // Print console output
  const consoleReporter = new ConsoleReporter();
  await consoleReporter.write(result.report, { color: true });

  process.exit(result.exitCode);
}

run().catch(err => {
  console.error("Failed to run architecture checks via governance package:", err);
  process.exit(20);
});
