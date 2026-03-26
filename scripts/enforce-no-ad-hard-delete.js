#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const scanRoot = path.join(repoRoot, "backend", "src");

const EXCLUDED_DIRS = new Set(["__tests__", "dist", "coverage", "node_modules"]);
const FILE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs"]);

const FORBIDDEN_PATTERNS = [
  /\bAd\.findByIdAndDelete\s*\(/,
  /\bAd\.findOneAndDelete\s*\(/,
  /\bAd\.deleteOne\s*\(/,
  /\bAd\.deleteMany\s*\(/,
  /\bAd\.remove\s*\(/,
];

function collectFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath));
      continue;
    }

    if (!entry.isFile()) continue;
    if (!FILE_EXTENSIONS.has(path.extname(entry.name))) continue;
    files.push(fullPath);
  }

  return files;
}

function main() {
  if (!fs.existsSync(scanRoot)) {
    console.log("PASS: backend/src not found.");
    return;
  }

  const files = collectFiles(scanRoot);
  const violations = [];

  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    if (!source.includes("Ad.")) continue;

    const lines = source.split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.test(line)) {
          violations.push({
            file: path.relative(repoRoot, file),
            line: index + 1,
            source: line.trim(),
          });
        }
      }
    });
  }

  if (violations.length === 0) {
    console.log("✅ Ad hard-delete guard passed.");
    return;
  }

  console.error("❌ Ad hard-delete guard failed.");
  for (const violation of violations) {
    console.error(`- ${violation.file}:${violation.line} ${violation.source}`);
  }
  console.error("\n[HINT] Direct deletion of Ad documents is forbidden to maintain audit trails.");
  console.error("1. Use 'lifecycleStatus' updates (e.g., 'deactivated', 'expired') instead of removal.");
  console.error("2. If you need to hide an ad, update its status using soft-delete patterns.\n");
  process.exit(1);
}

main();

