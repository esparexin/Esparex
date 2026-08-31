#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const scanDirs = [
    path.join(repoRoot, "apps", "web", "src"),
    path.join(repoRoot, "apps", "admin", "src"),
    path.join(repoRoot, "packages", "ui", "src")
];

const GLOBAL_FORBIDDEN_IMPORTS = [
    { pattern: /from\s+["']sonner["']/i, name: "sonner dependency" },
    { pattern: /from\s+["']react-hot-toast["']/i, name: "react-hot-toast dependency" },
    { pattern: /from\s+["']react-toastify["']/i, name: "react-toastify dependency" },
    { pattern: /from\s+["']notistack["']/i, name: "notistack dependency" },
    { pattern: /from\s+["']sweetalert2?["']/i, name: "sweetalert dependency" },
    { pattern: /from\s+["']@\/config\/toastMessages["']/i, name: "legacy toastMessages config" },
    { pattern: /from\s+["']@\/lib\/notify["']/i, name: "legacy notify helper" }
];

const WEB_SPECIFIC_FORBIDDEN_IMPORTS = [
    { pattern: /from\s+["'].*popupEvents["']/i, name: "legacy popupEvents helper (use @/lib/popup or @/lib/feedback in web)" }
];

const FORBIDDEN_USAGES = [
    { pattern: /<Toaster\s*/i, name: "<Toaster /> component usage" },
    { pattern: /<ToastContainer\s*/i, name: "<ToastContainer /> component usage" }
];

const walkDir = (dir) => {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of list) {
        const absPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (["node_modules", ".next", "dist", "coverage", ".turbo"].includes(entry.name)) continue;
            results = results.concat(walkDir(absPath));
        } else if (entry.isFile() && (absPath.endsWith(".ts") || absPath.endsWith(".tsx"))) {
            results.push(absPath);
        }
    }
    return results;
};

const main = () => {
    const files = scanDirs.flatMap(walkDir);
    const violations = [];

    for (const file of files) {
        const content = fs.readFileSync(file, "utf8");
        const relPath = path.relative(repoRoot, file);
        const isWebSrc = relPath.startsWith(path.join("apps", "web", "src"));

        // Check global forbidden imports
        for (const item of GLOBAL_FORBIDDEN_IMPORTS) {
            if (item.pattern.test(content)) {
                violations.push(`[IMPORTS VIOLATION] File: ${relPath} contains reference to: "${item.name}"`);
            }
        }

        // Check web-specific forbidden imports
        if (isWebSrc) {
            for (const item of WEB_SPECIFIC_FORBIDDEN_IMPORTS) {
                if (item.pattern.test(content)) {
                    violations.push(`[IMPORTS VIOLATION] File: ${relPath} contains reference to: "${item.name}"`);
                }
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
        console.error("The centralized popupBus / notify feedback system is the official Single Source of Truth.");
        console.error("External toast packages and legacy toast configs are strictly forbidden.");
        console.error("\nViolations found:");
        for (const v of violations) {
            console.error(`  - ${v}`);
        }
        process.exit(1);
    }

    console.log("✅ Notification Governance Guard Passed! Zero legacy toast references or third-party notification packages found.");
};

main();
