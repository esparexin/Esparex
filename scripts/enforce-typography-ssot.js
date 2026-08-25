#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");

const TARGET_DIRECTORIES = [
    path.join(repoRoot, "apps", "web", "src"),
    path.join(repoRoot, "apps", "admin", "src"),
    path.join(repoRoot, "apps", "mobile", "src"),
    path.join(repoRoot, "packages", "ui", "src"),
    path.join(repoRoot, "packages", "mobile-ui", "src"),
];

const SSOT_TOKEN_FILE = path.join(repoRoot, "packages", "ui", "src", "tokens", "typography.ts");

// Verify SSOT token file exists
if (!fs.existsSync(SSOT_TOKEN_FILE)) {
    console.error(`❌ Typography SSOT Governance Error: SSOT token file not found at ${SSOT_TOKEN_FILE}`);
    process.exit(1);
}

const ssotContent = fs.readFileSync(SSOT_TOKEN_FILE, "utf-8");
const expectedTokens = ["display", "h1", "h2", "h3", "h4", "body-lg", "body", "small", "caption", "tiny"];
const missingTokens = expectedTokens.filter(token => !ssotContent.includes(`'${token}'`) && !ssotContent.includes(`"${token}"`));

if (missingTokens.length > 0) {
    console.error(`❌ Typography SSOT Governance Error: Expected tokens missing from ${SSOT_TOKEN_FILE}: ${missingTokens.join(", ")}`);
    process.exit(1);
}

const ARBITRARY_FONT_SIZE_PATTERN = /\btext-\[\d+(?:\.\d+)?(?:px|rem|em)\]/g;
const ARBITRARY_FONT_WEIGHT_PATTERN = /\bfont-\[\d+\]/g;
const SUPPRESSION_PATTERN = /typography-ssot-ignore(?::\s*(.+))?/;

/**
 * Banned tokens: retired or non-canonical typography utilities that must
 * never reappear in source code after the typography SSOT remediation.
 *
 * text-2xs  — 10px legacy scale, retired in favour of text-tiny (11px)
 * --text-h5 — non-canonical CSS variable removed from design-token emit
 * --text-h6 — non-canonical CSS variable removed from design-token emit
 */
const BANNED_TOKEN_PATTERNS = [
    {
        pattern: /\btext-2xs\b/,
        token: "text-2xs",
        remedy: "Use text-tiny (11px) — the smallest canonical SSOT token.",
    },
    {
        pattern: /var\(--text-h5\)/,
        token: "var(--text-h5)",
        remedy: "Use var(--text-body-lg) — --text-h5 was removed from the design-token emit.",
    },
    {
        pattern: /var\(--text-h6\)/,
        token: "var(--text-h6)",
        remedy: "Use var(--text-body) — --text-h6 was removed from the design-token emit.",
    },
];

let bannedViolations = [];
let sizeViolations = [];
let weightViolations = [];
let emptySuppressions = [];

const checkLineForSuppression = (lines, lineIndex) => {
    // Check current line and preceding line for suppression comment
    const currentLine = lines[lineIndex] || "";
    const prevLine = lineIndex > 0 ? lines[lineIndex - 1] : "";

    const matchCurrent = currentLine.match(SUPPRESSION_PATTERN);
    const matchPrev = prevLine.match(SUPPRESSION_PATTERN);

    const match = matchCurrent || matchPrev;
    if (!match) return { suppressed: false };

    const reason = (match[1] || "").trim();
    if (!reason) {
        return { suppressed: false, emptySuppression: true };
    }

    return { suppressed: true, reason };
};

const walkDir = (dir) => {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (["node_modules", ".next", "dist", "coverage", "build"].includes(entry.name)) continue;
            walkDir(fullPath);
        } else if (entry.isFile() && (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx") || fullPath.endsWith(".js") || fullPath.endsWith(".jsx"))) {
            const content = fs.readFileSync(fullPath, "utf-8");
            const lines = content.split("\n");

            lines.forEach((line, index) => {
                const relPath = path.relative(repoRoot, fullPath);

                // Check for explicitly banned (retired) typography tokens — no suppressions allowed.
                for (const { pattern, token, remedy } of BANNED_TOKEN_PATTERNS) {
                    if (pattern.test(line)) {
                        bannedViolations.push({
                            file: relPath,
                            line: index + 1,
                            token,
                            remedy,
                            code: line.trim(),
                        });
                    }
                }

                const sizeMatches = line.match(ARBITRARY_FONT_SIZE_PATTERN);
                const weightMatches = line.match(ARBITRARY_FONT_WEIGHT_PATTERN);

                if (sizeMatches || weightMatches) {
                    const suppression = checkLineForSuppression(lines, index);

                    if (suppression.emptySuppression) {
                        emptySuppressions.push({
                            file: relPath,
                            line: index + 1,
                            code: line.trim(),
                        });
                    } else if (!suppression.suppressed) {
                        if (sizeMatches) {
                            sizeViolations.push({
                                file: relPath,
                                line: index + 1,
                                matches: sizeMatches,
                                code: line.trim(),
                            });
                        }
                        if (weightMatches) {
                            weightViolations.push({
                                file: relPath,
                                line: index + 1,
                                matches: weightMatches,
                                code: line.trim(),
                            });
                        }
                    }
                }
            });
        }
    }
};

for (const dir of TARGET_DIRECTORIES) {
    walkDir(dir);
}

let hasErrors = false;

if (bannedViolations.length > 0) {
    hasErrors = true;
    console.error("\n❌ Typography SSOT Governance Gate Violation: Banned (Retired) Token Detected!");
    console.error("The following typography tokens have been permanently retired from the Esparex SSOT.");
    console.error("They are absolutely prohibited. No suppression is allowed for banned tokens.\n");
    for (const v of bannedViolations) {
        console.error(`  ✗ ${v.file}:${v.line}`);
        console.error(`    Token:   ${v.token}`);
        console.error(`    Remedy:  ${v.remedy}`);
        console.error(`    Code:    ${v.code}\n`);
    }
}

if (emptySuppressions.length > 0) {
    hasErrors = true;
    console.error("\n❌ Typography SSOT Governance Gate Violation: Empty Suppressions Detected!");
    console.error("The `typography-ssot-ignore` comment requires a documented justification reason.");
    console.error("Format: `// typography-ssot-ignore: <reason for arbitrary utility>`\n");
    for (const s of emptySuppressions) {
        console.error(`  - ${s.file}:${s.line}`);
        console.error(`    Code: ${s.code}`);
    }
}

if (sizeViolations.length > 0) {
    hasErrors = true;
    console.error("\n❌ Typography SSOT Governance Gate Violation: Arbitrary Font Size Utilities Detected!");
    console.error("Arbitrary pixel/rem font size utilities (e.g. `text-[10px]`, `text-[1.2rem]`) are strictly prohibited.");
    console.error("Use approved SSOT tokens from `packages/ui/src/tokens/typography.ts` instead:");
    console.error("  - 11px -> `text-tiny`");
    console.error("  - 12px -> `text-caption`");
    console.error("  - 13px -> `text-small`");
    console.error("  - 14px -> `text-body`");
    console.error("  - 16px -> `text-body-lg`");
    console.error("  - 18px -> `text-h4`");
    console.error("  - 20px -> `text-h3`");
    console.error("  - 24px -> `text-h2`");
    console.error("  - 30px -> `text-h1`");
    console.error("  - 36px -> `text-display`\n");
    for (const v of sizeViolations) {
        console.error(`  - ${v.file}:${v.line}`);
        console.error(`    Matches: ${v.matches.join(", ")}`);
        console.error(`    Code: ${v.code}\n`);
    }
}

if (weightViolations.length > 0) {
    hasErrors = true;
    console.error("\n❌ Typography SSOT Governance Gate Violation: Arbitrary Font Weight Utilities Detected!");
    console.error("Arbitrary bracket font weight utilities (e.g. `font-[600]`) are strictly prohibited.");
    console.error("Use approved SSOT font weights (`font-normal`, `font-medium`, `font-semibold`, `font-bold`).\n");
    for (const v of weightViolations) {
        console.error(`  - ${v.file}:${v.line}`);
        console.error(`    Matches: ${v.matches.join(", ")}`);
        console.error(`    Code: ${v.code}\n`);
    }
}

if (hasErrors) {
    process.exit(1);
} else {
    console.log("✅ Typography SSOT Governance Gate Passed — 0 banned tokens, 0 unexempted arbitrary typography utilities found.");
}
