#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const RULE_NAME = "compatibility-markers-baseline";
const repoRoot = path.resolve(__dirname, "..");
const baselinePath = path.join(
  repoRoot,
  "scripts",
  "policy",
  "compatibility-marker-baseline.json"
);

const scanRoots = [
  path.join(repoRoot, "backend/api", "src"),
  path.join(repoRoot, "apps", "web", "src"),
  path.join(repoRoot, "apps/admin", "src"),
  path.join(repoRoot, "shared"),
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

function readBaseline() {
  if (!fs.existsSync(baselinePath)) {
    throw new Error(`Missing baseline allowlist: ${path.relative(repoRoot, baselinePath)}`);
  }
  return JSON.parse(fs.readFileSync(baselinePath, "utf8"));
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

function main() {
  const baseline = readBaseline();
  const actual = collectMarkerCounts();
  const failures = [];

  for (const [file, count] of Object.entries(actual)) {
    const allowedCount = baseline[file];

    if (allowedCount === undefined) {
      failures.push(`New compatibility marker file detected: ${file} (${count})`);
      continue;
    }

    if (count > allowedCount) {
      failures.push(
        `Compatibility markers increased: ${file} (${allowedCount} -> ${count})`
      );
    }
  }

  if (failures.length > 0) {
    console.error(`${RULE_NAME}: failed`);
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    console.error(
      "\n💡 HINT: New legacy / compatibility / @deprecated markers require explicit approval and a tracked removal plan."
    );
    console.error(
      "   Update scripts/policy/compatibility-marker-baseline.json only when the migration plan is intentionally expanded."
    );
    process.exit(1);
  }

  console.log(`${RULE_NAME}: passed`);
  console.log(`- tracked baseline files: ${Object.keys(baseline).length}`);
  console.log(
    `- current marker files in scope: ${Object.keys(actual).length}`
  );
}

main();
