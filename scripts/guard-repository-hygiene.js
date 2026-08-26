#!/usr/bin/env node

/**
 * guard-repository-hygiene.js
 *
 * Automated Repository Folder & File Hygiene Guard.
 * Enforces:
 * 1. Zero loose *.log files in root or workspace package roots.
 * 2. Zero misplaced native binaries or build bundles in repo root (.apk, .app, .ipa).
 * 3. Zero misplaced mobile project files in root (android/, ios/, app.json, index.js).
 * 4. Zero tracked files matching .gitignore patterns (e.g. playwright-report, generated cache).
 * 5. Clean, predictable monorepo folder structure.
 */

const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const violations = [];

console.log("🛡️  Running Repository Hygiene & Workspace Purity Guard...\n");

// 1. Prohibited files / folders in monorepo root
const PROHIBITED_ROOT_ENTRIES = [
    { name: "android", reason: "Android project belongs in apps/mobile/android, not in monorepo root." },
    { name: "Esparex.app", reason: "Native iOS/macOS bundle belongs in apps/mobile/ios/build/ or should be ignored." },
    { name: "esparex-release.apk", reason: "Android APK binary must not be placed in root." },
    { name: "app.json", reason: "Mobile app configuration belongs in apps/mobile/app.json, not root." },
    { name: "index.js", reason: "Mobile entry forwarder not permitted in root; use workspace script scoping." },
    { name: ".java-version", reason: "Java version config belongs in mobile workspace if needed." },
    { name: ".kombai", reason: "Legacy design tool cache directory should not exist." },
];

for (const item of PROHIBITED_ROOT_ENTRIES) {
    const target = path.join(ROOT, item.name);
    if (fs.existsSync(target)) {
        violations.push(`Prohibited root entry found: '${item.name}' — ${item.reason}`);
    }
}

// 2. Scan for loose *.log files in root and immediate workspace directories
const CHECK_DIRS_FOR_LOGS = [
    ROOT,
    path.join(ROOT, "backend", "api"),
    path.join(ROOT, "core"),
    path.join(ROOT, "apps", "web"),
    path.join(ROOT, "apps", "admin"),
    path.join(ROOT, "apps", "mobile"),
    path.join(ROOT, "shared"),
];

for (const dir of CHECK_DIRS_FOR_LOGS) {
    if (!fs.existsSync(dir)) continue;
    try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            if (file.endsWith(".log") && file !== "metro.log") {
                const relPath = path.relative(ROOT, path.join(dir, file));
                violations.push(`Loose log file detected in workspace: '${relPath}'. Log files must be in logs/ or gitignored.`);
            }
        }
    } catch {
        // Ignore read errors
    }
}

// 3. Scan for tracked files that match .gitignore rules
try {
    const trackedFiles = execSync("git ls-files", { cwd: ROOT, encoding: "utf8" })
        .split("\n")
        .filter(Boolean);

    // Check suspicious patterns in tracked files
    for (const file of trackedFiles) {
        if (
            file.startsWith("playwright-report/") ||
            file.startsWith("test-results/") ||
            file.endsWith(".apk") ||
            file.endsWith(".app") ||
            file.endsWith(".ipa") ||
            file.endsWith(".log") ||
            file.includes(".eslintcache")
        ) {
            violations.push(`Tracked file violates ignore rules: '${file}'. Remove from Git index via 'git rm --cached'.`);
        }
    }
} catch {
    // Git check fallback
}

// 4. Report results
if (violations.length > 0) {
    console.error("❌ Repository Hygiene Guard Violations Found:\n");
    for (const v of violations) {
        console.error(`  • ${v}`);
    }
    console.error("\nRun 'npm run clean' or remove the offending files/folders to pass the hygiene gate.\n");
    process.exit(1);
} else {
    console.log("✅ Repository Hygiene Guard: Monorepo folder and file structure is clean and compliant.");
    process.exit(0);
}
