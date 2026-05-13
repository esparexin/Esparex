#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const srcDir = path.join(repoRoot, "apps", "web", "src");

const FORBIDDEN_IMPORTS = [
    { pattern: /from\s+["']sonner["']/i, name: "sonner dependency" },
    { pattern: /from\s+["']@\/lib\/notify["']/i, name: "legacy notify helper" },
    { pattern: /from\s+["'].*popupEvents["']/i, name: "legacy popupEvents helper" }
];

const FORBIDDEN_USAGES = [
    { pattern: /<Toaster\s*/i, name: "<Toaster /> component usage" }
];

const walkDir = (dir) => {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of list) {
        const absPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (["node_modules", ".next", "dist", "coverage"].includes(entry.name)) continue;
            results = results.concat(walkDir(absPath));
        } else if (entry.isFile() && (absPath.endsWith(".ts") || absPath.endsWith(".tsx"))) {
            results.push(absPath);
        }
    }
    return results;
};

const main = () => {
    const files = walkDir(srcDir);
    const violations = [];

    for (const file of files) {
        const content = fs.readFileSync(file, "utf8");
        const relPath = path.relative(repoRoot, file);

        // Check forbidden imports
        for (const item of FORBIDDEN_IMPORTS) {
            if (item.pattern.test(content)) {
                violations.push(`[IMPORTS VIOLATION] File: ${relPath} contains reference to: "${item.name}"`);
            }
        }

        // Check forbidden usages
        for (const item of FORBIDDEN_USAGES) {
            if (item.pattern.test(content)) {
                violations.push(`[USAGES VIOLATION] File: ${relPath} contains: "${item.name}"`);
            }
        }
    }

    if (violations.length > 0) {
        console.error("❌ Notification Governance Guard Failed!");
        console.error("The centralized feedback system is now the official Single Source of Truth.");
        console.error("Do not use Sonner or legacy notify systems. Please use the centralized feedback system via useAppFeedback/feedback.ts.");
        console.error("\nViolations found:");
        for (const v of violations) {
            console.error(`  - ${v}`);
        }
        process.exit(1);
    }

    console.log("✅ Notification Governance Guard Passed! Zero legacy notification references or Sonner imports found.");
};

main();
