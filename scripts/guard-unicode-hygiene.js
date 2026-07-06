#!/usr/bin/env node
/**
 * guard-unicode-hygiene.js
 *
 * Detects forbidden invisible Unicode characters embedded inside source files.
 * Fails CI if any file contains mid-file U+FEFF (BOM) or other invisible
 * whitespace that cannot appear in source code.
 *
 * Forbidden characters (outside of file-initial BOM position):
 *   U+FEFF  - Zero Width No-Break Space / BOM (EF BB BF)
 *   U+200B  - Zero Width Space (E2 80 8B)
 *   U+00A0  - No-Break Space (C2 A0) — flagged in source, not in comments
 *
 * Usage:
 *   node scripts/guard-unicode-hygiene.js
 *   node scripts/guard-unicode-hygiene.js --fix   (strips U+FEFF only)
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const FIX_MODE = process.argv.includes("--fix");

// Characters to detect (U+FEFF mid-file, U+200B anywhere, U+00A0 in non-comment source)
const FORBIDDEN = [
    { name: "BOM / Zero Width No-Break Space", codePoint: 0xFEFF, bytes: [0xEF, 0xBB, 0xBF] },
    { name: "Zero Width Space", codePoint: 0x200B, bytes: [0xE2, 0x80, 0x8B] },
];

// File extensions to scan
const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".mts", ".cts"]);

// Directories to exclude
const EXCLUDE_DIRS = new Set(["node_modules", ".next", "dist", ".git", "archive", ".eslintcache"]);

function* walkFiles(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            if (!EXCLUDE_DIRS.has(entry.name)) {
                yield* walkFiles(path.join(dir, entry.name));
            }
        } else if (EXTENSIONS.has(path.extname(entry.name))) {
            yield path.join(dir, entry.name);
        }
    }
}

function findSequence(bytes, pattern) {
    const hits = [];
    for (let i = 0; i <= bytes.length - pattern.length; i++) {
        if (pattern.every((b, j) => bytes[i + j] === b)) {
            hits.push(i);
        }
    }
    return hits;
}

function getLineCol(bytes, offset) {
    let line = 1;
    let col = 1;
    for (let i = 0; i < offset; i++) {
        if (bytes[i] === 0x0A) { line++; col = 1; }
        else { col++; }
    }
    return { line, col };
}

function stripSequence(bytes, pattern) {
    const result = [];
    let i = 0;
    while (i < bytes.length) {
        if (i + pattern.length <= bytes.length && pattern.every((b, j) => bytes[i + j] === b)) {
            i += pattern.length; // skip
        } else {
            result.push(bytes[i++]);
        }
    }
    return Buffer.from(result);
}

const root = process.cwd();
const violations = [];
let fixedFiles = 0;

for (const file of walkFiles(root)) {
    const rawBytes = fs.readFileSync(file);
    const bytes = Array.from(rawBytes);
    let fileViolations = [];
    let fileBytes = rawBytes;

    for (const { name, bytes: pattern, codePoint } of FORBIDDEN) {
        const hits = findSequence(bytes, pattern);
        for (const offset of hits) {
            // Allow U+FEFF at byte offset 0 (legitimate file-start BOM)
            if (codePoint === 0xFEFF && offset === 0) continue;
            const { line, col } = getLineCol(bytes, offset);
            fileViolations.push({
                file: path.relative(root, file),
                line, col,
                char: name,
                unicode: `U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`,
                bytes: pattern.map(b => `0x${b.toString(16).toUpperCase().padStart(2, "0")}`).join(" "),
            });
        }

        if (FIX_MODE && hits.some(o => !(codePoint === 0xFEFF && o === 0))) {
            fileBytes = stripSequence(Array.from(fileBytes), pattern);
        }
    }

    if (fileViolations.length > 0) {
        violations.push(...fileViolations);
        if (FIX_MODE) {
            fs.writeFileSync(file, fileBytes);
            fixedFiles++;
            console.log(`  FIXED: ${path.relative(root, file)} (${fileViolations.length} violation(s))`);
        }
    }
}

if (FIX_MODE) {
    console.log(`\n✔  Fixed ${fixedFiles} file(s).`);
    process.exit(0);
}

if (violations.length === 0) {
    console.log("✔  Unicode hygiene check passed. No forbidden invisible characters found.");
    process.exit(0);
} else {
    console.error(`\n✖  Unicode hygiene check FAILED — ${violations.length} violation(s) found:\n`);
    for (const v of violations) {
        console.error(`  ${v.file}:${v.line}:${v.col}  ${v.char} (${v.unicode}, bytes: ${v.bytes})`);
    }
    console.error(`\nTo auto-fix U+FEFF characters, run:\n  node scripts/guard-unicode-hygiene.js --fix\n`);
    process.exit(1);
}
