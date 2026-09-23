#!/usr/bin/env node

/**
 * enforce-css-hygiene.js
 *
 * Automated CSS Hygiene & Styling Architecture Guard.
 * Enforces:
 * 1. Zero raw/unscoped <style> tags in TSX/JSX (prohibiting global document style injection leaks).
 * 2. Zero deprecated scrollbar utility classes (use canonical .scrollbar-hide).
 * 3. Zero purged/dead utility classes (.glass, .mesh-gradient-bg, .spotlight-bg, .mobile-tap-target, .shadow-premium-hover, .animate-reveal-up).
 * 4. Zero leaking top-level tag selectors with !important cascades in stylesheets.
 * 5. Zero purged legacy CSS classes (e.g. .chat-inbox-page, .conv-card-skeleton).
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const violations = [];

const TARGET_DIRECTORIES = [
    path.join(ROOT, "apps", "web", "src"),
    path.join(ROOT, "apps", "admin", "src"),
    path.join(ROOT, "packages", "ui", "src"),
];

const SUPPRESSION_PATTERN = /css-hygiene-ignore(?::\s*(.+))?/;

function walkDir(dir, fileList = [], extensions = [".tsx", ".jsx", ".ts", ".js", ".css"]) {
    if (!fs.existsSync(dir)) return fileList;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (
                entry.name !== "node_modules" &&
                entry.name !== ".next" &&
                entry.name !== "dist" &&
                entry.name !== ".git"
            ) {
                walkDir(fullPath, fileList, extensions);
            }
        } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (extensions.includes(ext)) {
                fileList.push(fullPath);
            }
        }
    }
    return fileList;
}

const allFiles = TARGET_DIRECTORIES.flatMap((d) => walkDir(d));

for (const filePath of allFiles) {
    const relPath = path.relative(ROOT, filePath);
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const isJsx = filePath.endsWith(".tsx") || filePath.endsWith(".jsx");
    const isCss = filePath.endsWith(".css");

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;

        // Skip suppression lines
        if (SUPPRESSION_PATTERN.test(line)) {
            continue;
        }
        if (i > 0 && SUPPRESSION_PATTERN.test(lines[i - 1])) {
            continue;
        }

        // Rule 1: No raw <style> tags in JSX/TSX
        if (isJsx && /<style[\s>]/.test(line)) {
            violations.push({
                file: relPath,
                line: lineNum,
                rule: "NO_RAW_STYLE_TAGS",
                message: `Unscoped <style> tag detected in ${relPath}:${lineNum}. Raw style tags inject unisolated global CSS into document head. Use CSS modules, @esparex/design-tokens, or Tailwind classes.`,
            });
        }

        // Rule 2: Banned scrollbar classes (use canonical .scrollbar-hide)
        const scrollbarMatch = line.match(/\b(no-scrollbar|scrollbar-none)\b/);
        if (scrollbarMatch) {
            violations.push({
                file: relPath,
                line: lineNum,
                rule: "BANNED_SCROLLBAR_CLASS",
                message: `Deprecated scrollbar utility '${scrollbarMatch[1]}' found in ${relPath}:${lineNum}. Use canonical '.scrollbar-hide' from @esparex/design-tokens / globals.css.`,
            });
        }

        // Rule 3: Purged dead utility classes
        const deadUtilMatch = line.match(/\b(mesh-gradient-bg|spotlight-bg|mobile-tap-target|shadow-premium-hover|animate-reveal-up)\b/);
        if (deadUtilMatch) {
            violations.push({
                file: relPath,
                line: lineNum,
                rule: "DEAD_UTILITY_CLASS",
                message: `Purged dead utility class '${deadUtilMatch[1]}' found in ${relPath}:${lineNum}. Use canonical design tokens and UI components.`,
            });
        }

        // Rule 3b: Dead .glass utility
        if (isCss && /\.glass\b/.test(line)) {
            violations.push({
                file: relPath,
                line: lineNum,
                rule: "DEAD_GLASS_UTILITY",
                message: `Purged '.glass' utility declaration found in ${relPath}:${lineNum}. Use design tokens or backdrop-blur utilities.`,
            });
        } else if (isJsx && /\bclassName=(?:["'][^"']*\bglass\b|`[^`]*\bglass\b)/.test(line)) {
            violations.push({
                file: relPath,
                line: lineNum,
                rule: "DEAD_GLASS_UTILITY",
                message: `Purged 'glass' class found in ${relPath}:${lineNum}. Use design tokens or backdrop-blur utilities.`,
            });
        }

        // Rule 4: Leaking selector cascades in CSS
        if (isCss && /\bheader\.sticky\b/.test(line)) {
            violations.push({
                file: relPath,
                line: lineNum,
                rule: "LEAKING_SELECTOR_CASCADE",
                message: `Leaking 'header.sticky' selector cascade detected in ${relPath}:${lineNum}. Tag-level sticky overrides bleed into modal and chat views.`,
            });
        }

        // Rule 5: Purged legacy classes in CSS
        if (isCss) {
            const legacyMatch = line.match(/\.(chat-inbox-page|conv-card-skeleton)\b/);
            if (legacyMatch) {
                violations.push({
                    file: relPath,
                    line: lineNum,
                    rule: "PURGED_LEGACY_CLASS",
                    message: `Purged legacy class '${legacyMatch[1]}' detected in ${relPath}:${lineNum}.`,
                });
            }
        }
    }
}

if (violations.length > 0) {
    console.error(`\n❌ CSS Hygiene Violations Found (${violations.length}):\n`);
    for (const v of violations) {
        console.error(`  - [${v.rule}] ${v.file}:${v.line}`);
        console.error(`    ${v.message}\n`);
    }
    process.exit(1);
} else {
    console.log(`✅ CSS Hygiene Enforcement: All checks passed (scanned ${allFiles.length} files, 0 violations).`);
    process.exit(0);
}
