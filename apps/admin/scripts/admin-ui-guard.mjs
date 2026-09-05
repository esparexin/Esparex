#!/usr/bin/env node
/**
 * admin-ui-guard.mjs
 * Pre-commit / CI guard — enforces permanent frontend architecture rules for apps/admin:
 *
 * Rules Enforced:
 *   1. Rule A — No pass-through wrappers or local @/components/ui imports (SSOT from @esparex/ui)
 *   2. Rule B/C — No fake/no-op search handlers on AdminFilterToolbar
 *   3. Rule D — No raw unportalled modal implementations
 *   4. Rule E — No direct DOM queries in React UI (document.getElementById / querySelector)
 *   5. Rule H — No dead import suppression hacks (void unused)
 *
 * Usage (package.json scripts):
 *   "guard:ui": "node scripts/admin-ui-guard.mjs"
 */

import fs from "node:fs";
import path from "node:path";

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const projectRoot = path.resolve(__dirname, "..");
const srcRoot = path.join(projectRoot, "src");

const violations = [];

function walk(dir, files = []) {
    if (!fs.existsSync(dir)) return files;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (["node_modules", ".next", "dist", "coverage", "__tests__"].includes(entry.name)) continue;
            walk(fullPath, files);
        } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
            files.push(fullPath);
        }
    }
    return files;
}

function rel(filePath) {
    return path.relative(projectRoot, filePath).replaceAll(path.sep, "/");
}

const allSourceFiles = walk(srcRoot);

// ─── 1. Rule A: No @/components/ui imports or local pass-through wrappers ────
for (const file of allSourceFiles) {
    const content = fs.readFileSync(file, "utf8");
    const lines = content.split("\n");

    // Check for @/components/ui imports
    if (/@\/components\/ui(\/|$)/.test(content)) {
        violations.push(
            `Rule A Violation: Prohibited import from "@/components/ui" in ${rel(file)}. Use "@esparex/ui" directly.`
        );
    }

    // Check for one-liner pass-through wrappers (excluding page/layout entry points)
    const isNextRoute = file.includes("/app/") && (file.endsWith("page.tsx") || file.endsWith("layout.tsx") || file.endsWith("route.ts") || file.endsWith("not-found.tsx") || file.endsWith("error.tsx"));
    if (!isNextRoute && lines.length <= 5) {
        const isWrapper = lines.some((l) => /^\s*export\s+.*\s+from\s+["']/.test(l));
        if (isWrapper && !lines.some((l) => l.includes("pass-through-allowed"))) {
            violations.push(
                `Rule A Violation: Unnecessary pass-through wrapper detected at ${rel(file)}. Consumers must import canonical source directly.`
            );
        }
    }

    // ─── 2. Rule B/C: No fake search or no-op handlers on AdminFilterToolbar ───
    if (/onSearchChange=\{\s*\(\)\s*=>\s*\{\s*\}\s*\}/.test(content)) {
        violations.push(
            `Rule B/C Violation: No-op onSearchChange detected in ${rel(file)}. Set "showSearch={false}" in AdminFilterToolbar instead of passing a fake handler.`
        );
    }
    if (/onClick=\{\s*\(\)\s*=>\s*\{\s*\}\s*\}/.test(content) && !content.includes("ui-guard-ignore")) {
        violations.push(
            `Rule B/C Violation: No-op onClick handler detected in ${rel(file)}. Remove non-functional interactive controls.`
        );
    }

    // ─── 3. Rule D: No raw unportalled modal implementations ──────────────────
    if (file.endsWith(".tsx")) {
        const hasRawDialog = /<div[^>]*\brole=["'](?:dialog|alertdialog)["']/.test(content);
        const hasPortalOrDialog = /from\s+["']@esparex\/ui["']/.test(content) || /from\s+["']@radix-ui\/react-dialog["']/.test(content) || /createPortal/.test(content);
        if (hasRawDialog && !hasPortalOrDialog) {
            violations.push(
                `Rule D Violation: Raw unportalled modal overlay detected in ${rel(file)}. Must use canonical "@esparex/ui" Dialog/Sheet/Drawer primitives.`
            );
        }
    }

    // ─── 4. Rule E: No direct DOM queries in React components ─────────────────
    if (file.endsWith(".tsx")) {
        if (/document\.(getElementById|querySelector|getElementsByClassName)\(/.test(content)) {
            violations.push(
                `Rule E Violation: Direct DOM query detected in React component ${rel(file)}. Use React state or refs instead.`
            );
        }
    }

    // ─── 5. Rule H: No suppression hacks for dead imports ─────────────────────
    const voidSuppression = content.match(/void\s+([a-zA-Z0-9_$]+);/g);
    if (voidSuppression && voidSuppression.length > 0) {
        violations.push(
            `Rule H Violation: Dead import suppression hack "${voidSuppression.join(", ")}" in ${rel(file)}. Remove the unused import instead of suppressing.`
        );
    }
}

if (violations.length > 0) {
    console.error(`\n❌ Admin Frontend Architecture Guard failed: ${violations.length} violation(s) found:\n`);
    for (const violation of violations) {
        console.error(`  • ${violation}`);
    }
    console.error("\nPlease correct the architectural issues above to comply with Esparex Admin Governance.\n");
    process.exit(1);
} else {
    console.log(`✅ Admin Frontend Architecture Guard passed — ${allSourceFiles.length} files verified.`);
}
