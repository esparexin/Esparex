#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const appDirs = [
    path.join(repoRoot, "apps", "web", "src"),
    path.join(repoRoot, "apps", "admin", "src"),
    path.join(repoRoot, "backend", "api", "src"),
    path.join(repoRoot, "core", "src"),
    path.join(repoRoot, "packages"),
];

const FORBIDDEN_PATTERN = /from\s+["']@shared(?:\/[^"']*)?["']/g;

let violations = [];

const walkDir = (dir) => {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (["node_modules", ".next", "dist", "coverage"].includes(entry.name)) continue;
            walkDir(fullPath);
        } else if (entry.isFile() && (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx"))) {
            const content = fs.readFileSync(fullPath, "utf-8");
            const matches = content.match(FORBIDDEN_PATTERN);
            if (matches) {
                const relPath = path.relative(repoRoot, fullPath);
                violations.push({ file: relPath, matches });
            }
        }
    }
};

for (const dir of appDirs) {
    walkDir(dir);
}

if (violations.length > 0) {
    console.error("❌ Shared SSOT Governance Gate Violation!");
    console.error("Legacy `@shared` imports are strictly forbidden. Use `@esparex/shared` instead.\n");
    for (const v of violations) {
        console.error(`- File: ${v.file}`);
        console.error(`  Matches: ${v.matches.join(", ")}`);
    }
    process.exit(1);
} else {
    console.log("✅ Shared SSOT Governance Gate Passed — 0 `@shared` imports found.");
}
