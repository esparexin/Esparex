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
  path.join(repoRoot, "core", "src"),
  path.join(repoRoot, "apps", "web", "src"),
  path.join(repoRoot, "apps/admin", "src"),
  path.join(repoRoot, "apps/mobile", "src"),
  path.join(repoRoot, "packages/ui", "src"),
  path.join(repoRoot, "packages/mobile-ui", "src"),
  path.join(repoRoot, "packages/contracts", "src"),
  path.join(repoRoot, "packages/design-tokens", "src"),
  path.join(repoRoot, "shared", "src"),
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
  const shouldRatchet = process.argv.includes("--ratchet");
  const checkRatchet = process.argv.includes("--check-ratchet");
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

  // Ratchet Analysis
  let prunableFiles = 0;
  let lowerableFiles = 0;
  const ratchetedBaseline = {};

  for (const [file, allowedCount] of Object.entries(baseline)) {
    const act = actual[file];
    if (act === undefined || act === 0) {
      prunableFiles++;
    } else {
      if (act < allowedCount) {
        lowerableFiles++;
        ratchetedBaseline[file] = act;
      } else {
        ratchetedBaseline[file] = allowedCount;
      }
    }
  }

  if (shouldRatchet) {
    if (prunableFiles > 0 || lowerableFiles > 0) {
      const sortedBaseline = Object.keys(ratchetedBaseline)
        .sort()
        .reduce((acc, key) => {
          acc[key] = ratchetedBaseline[key];
          return acc;
        }, {});
      fs.writeFileSync(baselinePath, JSON.stringify(sortedBaseline, null, 2) + "\n", "utf8");
      console.log(`✅ ${RULE_NAME}: baseline ratcheted down successfully`);
      console.log(`- pruned ${prunableFiles} clean files with zero markers`);
      console.log(`- lowered ceiling for ${lowerableFiles} files`);
      console.log(`- new tracked baseline files: ${Object.keys(sortedBaseline).length}`);
    } else {
      console.log(`ℹ️ ${RULE_NAME}: baseline is already at minimal ceiling (no ratchet needed)`);
    }
  } else if (checkRatchet && (prunableFiles > 0 || lowerableFiles > 0)) {
    console.error(`❌ ${RULE_NAME}: baseline ratchet check failed!`);
    console.error(`- ${prunableFiles} clean files can be pruned from baseline`);
    console.error(`- ${lowerableFiles} files have lower marker counts`);
    console.error(`Run 'node scripts/enforce-compatibility-markers-baseline.js --ratchet' to lock in progress.`);
    process.exit(1);
  } else if (prunableFiles > 0 || lowerableFiles > 0) {
    console.log(`ℹ️ Ratchet opportunity: ${prunableFiles} clean files can be pruned, ${lowerableFiles} lowered with --ratchet.`);
  }

  console.log(`${RULE_NAME}: passed`);
  console.log(`- tracked baseline files: ${Object.keys(shouldRatchet ? ratchetedBaseline : baseline).length}`);
  console.log(
    `- current marker files in scope: ${Object.keys(actual).length}`
  );
}

main();
