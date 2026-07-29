#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");

const TARGET_DIRECTORIES = [
    path.join(repoRoot, "apps", "web", "src"),
    path.join(repoRoot, "apps", "admin", "src"),
];

const SSOT_TOKEN_FILE = path.join(repoRoot, "packages", "ui", "src", "tokens", "typography.ts");

// Verify SSOT token file exists
if (!fs.existsSync(SSOT_TOKEN_FILE)) {
    console.error(`❌ Typography SSOT Governance Error: SSOT token file not found at ${SSOT_TOKEN_FILE}`);
    process.exit(1);
}

const ssotContent = fs.readFileSync(SSOT_TOKEN_FILE, "utf-8");
const expectedTokens = ["display", "h1", "h2", "h3", "h4", "body", "small", "caption", "tiny"];
const missingTokens = expectedTokens.filter(token => !ssotContent.includes(`'${token}'`) && !ssotContent.includes(`"${token}"`));

if (missingTokens.length > 0) {
    console.error(`❌ Typography SSOT Governance Error: Expected tokens missing from ${SSOT_TOKEN_FILE}: ${missingTokens.join(", ")}`);
    process.exit(1);
}

const ARBITRARY_FONT_PATTERN = /\btext-\[\d+px\]/g;
const SUPPRESSION_PATTERN = /typography-ssot-ignore(?::\s*(.+))?/;

let violations = [];
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
                const matches = line.match(ARBITRARY_FONT_PATTERN);
                if (matches) {
                    const suppression = checkLineForSuppression(lines, index);
                    const relPath = path.relative(repoRoot, fullPath);

                    if (suppression.emptySuppression) {
                        emptySuppressions.push({
                            file: relPath,
                            line: index + 1,
                            code: line.trim(),
                        });
                    } else if (!suppression.suppressed) {
                        violations.push({
                            file: relPath,
                            line: index + 1,
                            matches,
                            code: line.trim(),
                        });
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

if (violations.length > 0) {
    hasErrors = true;
    console.error("\n❌ Typography SSOT Governance Gate Violation: Arbitrary Font Size Utilities Detected!");
    console.error("Arbitrary pixel font size utilities (e.g. `text-[10px]`) are strictly prohibited.");
    console.error("Use approved SSOT tokens from `packages/ui/src/tokens/typography.ts` instead (`text-tiny`, `text-small`, `text-caption`, `text-body`, `text-h4`, `text-h3`, `text-h2`, `text-h1`, `text-display`).\n");
    for (const v of violations) {
        console.error(`  - ${v.file}:${v.line}`);
        console.error(`    Matches: ${v.matches.join(", ")}`);
        console.error(`    Code: ${v.code}\n`);
    }
}

if (hasErrors) {
    process.exit(1);
} else {
    console.log("✅ Typography SSOT Governance Gate Passed — 0 unexempted arbitrary font-size utilities found.");
}
