#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "../..");
const baselinePath = path.join(
  repoRoot,
  "scripts",
  "policy",
  "compatibility-marker-baseline.json"
);

const scanRoots = [
  path.join(repoRoot, "user-backend", "src"),
  path.join(repoRoot, "user-frontend", "src"),
  path.join(repoRoot, "admin-frontend", "src"),
  path.join(repoRoot, "admin-backend", "src"),
  path.join(repoRoot, "shared"),
  path.join(repoRoot, "core", "src"),
];

const EXCLUDED_DIRS = new Set(["node_modules", "dist", ".next", "coverage"]);
const FILE_PATTERN = /\.(ts|tsx|js|jsx|mjs|cjs)$/;
const MARKER_PATTERN = /\blegacy\b|compatibility|@deprecated/gi;

function toUnixPath(input) {
  return input.replaceAll(path.sep, "/");
}

function walk(dir, output = []) {
  if (!fs.existsSync(dir)) return output;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, output);
      continue;
    }

    if (!entry.isFile() || !FILE_PATTERN.test(entry.name)) continue;
    output.push(fullPath);
  }

  return output;
}

function collectMarkerCounts() {
  const counts = {};
  const files = scanRoots.flatMap((root) => walk(root));

  for (const filePath of files) {
    const source = fs.readFileSync(filePath, "utf8");
    const matches = source.match(MARKER_PATTERN);
    if (!matches?.length) continue;

    const relativePath = toUnixPath(path.relative(repoRoot, filePath));
    counts[relativePath] = matches.length;
  }

  return counts;
}

const counts = collectMarkerCounts();
const sortedCounts = Object.fromEntries(
  Object.entries(counts).sort(([a], [b]) => a.localeCompare(b))
);

fs.writeFileSync(baselinePath, JSON.stringify(sortedCounts, null, 2) + "\n");
console.log(`Updated baseline at ${baselinePath}`);
console.log(`Tracked files: ${Object.keys(sortedCounts).length}`);
