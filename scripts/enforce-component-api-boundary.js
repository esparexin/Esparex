#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const RULE_NAME = "component-api-boundary";
const repoRoot = path.resolve(__dirname, "..");
const baselinePath = path.join(
  repoRoot,
  "scripts",
  "policy",
  "component-api-boundary-baseline.json"
);

const scanRoots = [
  path.join(repoRoot, "frontend", "src", "components"),
  path.join(repoRoot, "admin-frontend", "src", "components"),
];

const EXCLUDED_DIRS = new Set(["node_modules", "dist", ".next", "coverage"]);
const FILE_PATTERN = /\.(ts|tsx|js|jsx)$/;
const SYMBOL_PATTERNS = {
  apiClient: /\bapiClient\s*\./g,
  adminFetch: /\badminFetch\s*(?:<[^>\n]+>)?\s*\(/g,
  chatApi: /\bchatApi\s*\./g,
  createListing: /\bcreateListing\s*\(/g,
  updateListing: /\bupdateListing\s*\(/g,
  fetchUserApiJson: /\bfetchUserApiJson\s*(?:<[^>\n]+>)?\s*\(/g,
};

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

  const parsed = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
  return Object.fromEntries(
    Object.entries(parsed).map(([file, symbols]) => [file, [...new Set(symbols)].sort()])
  );
}

function collectViolations() {
  const found = {};
  const files = scanRoots.flatMap((root) => walk(root));

  for (const filePath of files) {
    const source = fs.readFileSync(filePath, "utf8");
    const symbols = [];

    for (const [symbol, pattern] of Object.entries(SYMBOL_PATTERNS)) {
      if (pattern.test(source)) {
        symbols.push(symbol);
      }
      pattern.lastIndex = 0;
    }

    if (symbols.length === 0) continue;

    const relativePath = toUnixPath(path.relative(repoRoot, filePath));
    found[relativePath] = symbols.sort();
  }

  return found;
}

function main() {
  const baseline = readBaseline();
  const actual = collectViolations();
  const failures = [];

  for (const [file, symbols] of Object.entries(actual)) {
    const allowed = baseline[file];

    if (!allowed) {
      failures.push(`New direct API usage in React component: ${file} -> ${symbols.join(", ")}`);
      continue;
    }

    const unexpected = symbols.filter((symbol) => !allowed.includes(symbol));
    if (unexpected.length > 0) {
      failures.push(
        `Expanded direct API usage in baseline-tracked component: ${file} -> ${unexpected.join(", ")}`
      );
    }
  }

  if (failures.length > 0) {
    console.error(`${RULE_NAME}: failed`);
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    console.error(
      "\n💡 HINT: React components must stay presentation-focused. Move data access into hooks or lib/api modules."
    );
    console.error(
      "   If an existing violation is intentionally grandfathered, update scripts/policy/component-api-boundary-baseline.json only with migration-plan review."
    );
    process.exit(1);
  }

  console.log(`${RULE_NAME}: passed`);
  console.log(`- tracked baseline files: ${Object.keys(baseline).length}`);
  console.log(`- current direct API component files: ${Object.keys(actual).length}`);
}

main();
