#!/usr/bin/env node

/**
 * Local Quality Gates Enforcement (Cross-Platform)
 * Executes quality checks across backend and web workspaces natively.
 */

const { execSync } = require('child_process');

console.log("[governance] Running mandatory local quality gates...");

function runCmd(cmd) {
    console.log(`[governance] Executing: ${cmd}`);
    execSync(cmd, { stdio: 'inherit' });
}

try {
    runCmd("npm run lint -w @esparex/backend-api");
    runCmd("npm run type-check -w @esparex/backend-api");
    runCmd("npm run build -w @esparex/backend-api");
    runCmd("npm run lint -w @esparex/apps-web");
    runCmd("npm run type-check -w @esparex/apps-web");
    runCmd("npm run build -w @esparex/apps-web");
    console.log("[governance] Quality gates passed.");
} catch (e) {
    console.error("❌ Quality gates execution failed:", e.message);
    process.exit(1);
}
